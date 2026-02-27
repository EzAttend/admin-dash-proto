import { Schema, model, Document, Types } from 'mongoose';

export interface IGeofenceCoordinate {
  lat: number;
  lng: number;
}

export interface IRoom extends Document {
  _id: Types.ObjectId;
  room_number: string;
  building_name: string;
  floor_number: number;
  geofence_coordinates: IGeofenceCoordinate[];
  base_altitude?: number;
  createdAt: Date;
  updatedAt: Date;
}

const geofenceCoordinateSchema = new Schema<IGeofenceCoordinate>(
  {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
  },
  { _id: false },
);

const roomSchema = new Schema<IRoom>(
  {
    room_number: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    building_name: {
      type: String,
      required: true,
      trim: true,
    },
    floor_number: {
      type: Number,
      required: true,
    },
    geofence_coordinates: {
      type: [geofenceCoordinateSchema],
      default: [],
    },
    base_altitude: {
      type: Number,
    },
  },
  { timestamps: true },
);

export const Room = model<IRoom>('Room', roomSchema);
