import { Schema, model, Document, Types } from 'mongoose';

export const DAYS_OF_WEEK = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
] as const;
export type DayOfWeek = typeof DAYS_OF_WEEK[number];

export interface ITimetable extends Document {
    _id: Types.ObjectId;
    class_id: Types.ObjectId;
    teacher_id: Types.ObjectId;
    subject_id: Types.ObjectId;
    room_id: Types.ObjectId;
    day_of_week: DayOfWeek;
    start_time: string;
    end_time: string;
    createdAt: Date;
    updatedAt: Date;
}

const timetableSchema = new Schema<ITimetable>(
    {
        class_id: {
            type: Schema.Types.ObjectId,
            ref: 'Class',
            required: true,
        },
        teacher_id: {
            type: Schema.Types.ObjectId,
            ref: 'Teacher',
            required: true,
        },
        subject_id: {
            type: Schema.Types.ObjectId,
            ref: 'Subject',
            required: true,
        },
        room_id: {
            type: Schema.Types.ObjectId,
            ref: 'Room',
            required: true,
        },
        day_of_week: {
            type: String,
            enum: DAYS_OF_WEEK,
            required: true,
        },
        start_time: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
        end_time: {
            type: String,
            required: true,
            match: /^([01]\d|2[0-3]):[0-5]\d$/,
        },
    },
    { timestamps: true },
);

// Compound unique index: no class can have two entries at the same day+time
timetableSchema.index(
    { class_id: 1, day_of_week: 1, start_time: 1 },
    { unique: true },
);

export const Timetable = model<ITimetable>('Timetable', timetableSchema);
