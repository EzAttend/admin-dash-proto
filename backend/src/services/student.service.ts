import mongoose from 'mongoose';
import { Student, User, AuthAccount } from '@/models';
import type { IStudent } from '@/models';
import { validateRefs } from '@/ingestion';
import type { RefCheck } from '@/ingestion';
import { AppError, hashPassword } from '@/utils';

const STUDENT_REFS: readonly RefCheck[] = [
  { field: 'class_id', modelName: 'Class' },
];


const POPULATE_SPECS = [
  { path: 'userId', select: 'name email role' },
  { path: 'class_id', select: 'class_name batch' },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyPopulate(query: any): any {
  for (const p of POPULATE_SPECS) {
    query = query.populate(p);
  }
  return query;
}

export const studentService = {
  async list(): Promise<IStudent[]> {
    const query = Student.find().sort({ createdAt: -1 });
    return applyPopulate(query).lean() as unknown as IStudent[];
  },

  async getById(id: string): Promise<IStudent> {
    const query = Student.findById(id);
    const doc = await applyPopulate(query).lean();
    if (!doc) throw AppError.notFound('Student');
    return doc as IStudent;
  },

  async create(data: Record<string, unknown>): Promise<IStudent> {
    const { name, email, password, ...domainFields } = data as {
      name: string;
      email: string;
      password: string;
      [key: string]: unknown;
    };

    // Validate domain refs before starting transaction
    await validateRefs(domainFields, STUDENT_REFS);

    const existingUser = await User.exists({ email });
    if (existingUser) {
      throw AppError.conflict(`Email '${email}' is already in use`);
    }

    const passwordHash = await hashPassword(password);

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // 1. Create User
      const [user] = await User.create(
        [{ name, email, role: 'student' }],
        { session },
      );

      await AuthAccount.create(
        [{ userId: user._id, accountId: user._id, providerId: 'credential', password: passwordHash }],
        { session },
      );

      const [student] = await Student.create(
        [{
          userId: user._id,
          ...domainFields,
        }],
        { session },
      );

      await session.commitTransaction();

      return this.getById(student._id.toString());
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async update(id: string, data: Record<string, unknown>): Promise<IStudent> {
    const { name, email, password, ...domainFields } = data as {
      name?: string;
      email?: string;
      password?: string;
      [key: string]: unknown;
    };

    // Validate domain refs if present
    await validateRefs(domainFields, STUDENT_REFS);

    const existing = await Student.findById(id);
    if (!existing) throw AppError.notFound('Student');

    // Check email uniqueness if changing
    if (email) {
      const conflict = await User.exists({
        email,
        _id: { $ne: existing.userId },
      });
      if (conflict) {
        throw AppError.conflict(`Email '${email}' is already in use`);
      }
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      // 1. Update User identity fields
      const userUpdate: Record<string, unknown> = {};
      if (name !== undefined) userUpdate.name = name;
      if (email !== undefined) userUpdate.email = email;

      if (Object.keys(userUpdate).length > 0) {
        await User.updateOne(
          { _id: existing.userId },
          { $set: userUpdate },
          { session },
        );
      }

      if (password) {
        const passwordHash = await hashPassword(password);
        await AuthAccount.updateOne(
          { userId: existing.userId },
          { $set: { password: passwordHash } },
          { session },
        );
      }

      if (Object.keys(domainFields).length > 0) {
        await Student.updateOne(
          { _id: id },
          { $set: domainFields },
          { session, runValidators: true },
        );
      }

      await session.commitTransaction();

      return this.getById(id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async remove(id: string): Promise<IStudent> {
    const student = await Student.findById(id);
    if (!student) throw AppError.notFound('Student');

    const snapshot = await this.getById(id);

    const session = await mongoose.startSession();
    try {
      session.startTransaction();

      await Student.deleteOne({ _id: id }, { session });

      await AuthAccount.deleteOne({ userId: student.userId }, { session });

      await User.deleteOne({ _id: student.userId }, { session });

      await session.commitTransaction();

      return snapshot;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
