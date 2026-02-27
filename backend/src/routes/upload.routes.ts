import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { asyncHandler, requireAuth } from '@/middleware';
import { ENTITY_TYPES, type EntityType } from '@/models/upload-job.model';
import { parseCsv } from '@/ingestion/parsers';
import { createJob, markJobFailed } from '@/services/job.service';
import { publishJob } from '@/jobs/publisher';
import {
  classEntityConfig,
  subjectEntityConfig,
  roomEntityConfig,
  studentEntityConfig,
  teacherEntityConfig,
  timetableEntityConfig,
} from '@/ingestion/entity-configs';
import type { EntityConfig } from '@/ingestion/types';
import { StatusCodes } from 'http-status-codes';

const router = Router();

// All upload routes require authentication
router.use(requireAuth);

const ENTITY_CONFIG_MAP: Record<EntityType, EntityConfig<Record<string, unknown>>> = {
  CLASS_IMPORT: classEntityConfig as unknown as EntityConfig<Record<string, unknown>>,
  SUBJECT_IMPORT: subjectEntityConfig as unknown as EntityConfig<Record<string, unknown>>,
  ROOM_IMPORT: roomEntityConfig as unknown as EntityConfig<Record<string, unknown>>,
  STUDENT_IMPORT: studentEntityConfig as unknown as EntityConfig<Record<string, unknown>>,
  TEACHER_IMPORT: teacherEntityConfig as unknown as EntityConfig<Record<string, unknown>>,
  TIMETABLE_IMPORT: timetableEntityConfig as unknown as EntityConfig<Record<string, unknown>>,
};

router.post(
  '/:entityType',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const entityType = req.params.entityType as string;

    // Validate entity type
    if (!ENTITY_TYPES.includes(entityType as EntityType)) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: `Invalid entity type: ${entityType}. Must be one of: ${ENTITY_TYPES.join(', ')}`,
      });
      return;
    }

    const typedEntityType = entityType as EntityType;
    const config = ENTITY_CONFIG_MAP[typedEntityType];

    // Read CSV body
    let csvContent: string;

    if (typeof req.body === 'string') {
      csvContent = req.body;
    } else if (Buffer.isBuffer(req.body)) {
      csvContent = req.body.toString('utf-8');
    } else if (req.body?.csv && typeof req.body.csv === 'string') {
    // JSON body with { csv: "..." }
      csvContent = req.body.csv;
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'Request body must contain CSV data. Send as text/csv, or JSON { "csv": "..." }',
      });
      return;
    }

    if (!csvContent.trim()) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'CSV content is empty',
      });
      return;
    }

    // Sync gatekeeper: validate headers + count rows
    const { rows, errors: parseErrors } = await parseCsv(
      csvContent,
      config.expectedHeaders,
    );

    if (parseErrors.length > 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'CSV validation failed — job not created',
        errors: parseErrors,
      });
      return;
    }

    if (rows.length === 0) {
      res.status(StatusCodes.BAD_REQUEST).json({
        status: 'error',
        message: 'CSV contains no data rows',
      });
      return;
    }

    // Precondition check
    if (config.preconditions && config.preconditions.length > 0) {
      const missing: string[] = [];

      await Promise.all(
        config.preconditions.map(async (modelName) => {
          const model = mongoose.model(modelName);
          const exists = await model.exists({});
          if (!exists) {
            missing.push(modelName);
          }
        }),
      );

      if (missing.length > 0) {
        res.status(StatusCodes.BAD_REQUEST).json({
          status: 'error',
          message: `Import precondition failed — required collections are empty: ${missing.join(', ')}. Create these records before importing.`,
          errors: missing.map((m) => ({
            row: 0,
            column: '',
            code: 'PRECONDITION_FAILED',
            message: `No ${m} records exist. Please create ${m} entries first.`,
          })),
        });
        return;
      }
    }

    // Create job record
    const job = await createJob({
      entityType: typedEntityType,
      totalRows: rows.length,
    });

    // Publish to RabbitMQ
    try {
      await publishJob({
        jobId: job._id.toString(),
        entityType: typedEntityType,
        totalRows: rows.length,
        csvPayload: Buffer.from(csvContent).toString('base64'),
      });
    } catch (err) {
      // Queue failure — mark job as FAILED
      await markJobFailed(job._id, `Failed to enqueue: ${(err as Error).message}`);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        status: 'error',
        message: 'Failed to enqueue job — please retry',
        jobId: job._id.toString(),
      });
      return;
    }

    // Return job reference
    res.status(StatusCodes.ACCEPTED).json({
      status: 'ok',
      message: `Import job created for ${rows.length} rows. Track via /api/jobs/${job._id}`,
      data: {
        jobId: job._id.toString(),
        entityType: typedEntityType,
        totalRows: rows.length,
        status: 'PENDING',
      },
    });
  }),
);

export const uploadRoutes = router;
