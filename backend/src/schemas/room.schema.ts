import { z } from 'zod';

function stripAltitudeUnit(val: unknown): unknown {
  if (typeof val === 'string') {
    return parseFloat(val.replace(/\s*[mM]$/, ''));
  }
  return val;
}

const geofenceCoordinateSchema = z.object({
  lat: z.number({ required_error: 'Latitude is required' }),
  lng: z.number({ required_error: 'Longitude is required' }),
});

export const createRoomSchema = z.object({
  room_number: z
    .string()
    .trim()
    .min(1, 'Room number is required'),
  building_name: z
    .string()
    .trim()
    .min(1, 'Building name is required'),
  floor_number: z
    .number({ required_error: 'Floor number is required' })
    .int('Floor number must be an integer'),
  geofence_coordinates: z
    .array(geofenceCoordinateSchema)
    .optional()
    .default([]),
  base_altitude: z.preprocess(
    stripAltitudeUnit,
    z.number().optional(),
  ),
});

export const updateRoomSchema = createRoomSchema.partial();

export type CreateRoomInput = z.infer<typeof createRoomSchema>;
export type UpdateRoomInput = z.infer<typeof updateRoomSchema>;
