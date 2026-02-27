'use client';

import { useState } from 'react';
import { FormField, inputClass } from '@/components/ui';
import type { RoomEntity } from '@/lib/types';

interface Coordinate {
  lat: string;
  lng: string;
}

interface RoomFormProps {
  initial?: RoomEntity | null;
  fieldErrors: Record<string, string>;
  onSubmit: (data: {
    room_number: string;
    building_name: string;
    floor_number: number;
    geofence_coordinates: Array<{ lat: number; lng: number }>;
    base_altitude?: number;
  }) => void;
  loading: boolean;
}

export function RoomForm({ initial, fieldErrors, onSubmit, loading }: RoomFormProps) {
  const [roomNumber, setRoomNumber] = useState(initial?.room_number ?? '');
  const [buildingName, setBuildingName] = useState(initial?.building_name ?? '');
  const [floorNumber, setFloorNumber] = useState(initial ? String(initial.floor_number) : '');
  const [baseAltitude, setBaseAltitude] = useState(
    initial?.base_altitude != null ? String(initial.base_altitude) : '',
  );
  const [coords, setCoords] = useState<Coordinate[]>(
    initial?.geofence_coordinates.map((c) => ({
      lat: String(c.lat),
      lng: String(c.lng),
    })) ?? [],
  );

  function addCoord() {
    setCoords([...coords, { lat: '', lng: '' }]);
  }

  function removeCoord(idx: number) {
    setCoords(coords.filter((_, i) => i !== idx));
  }

  function updateCoord(idx: number, field: 'lat' | 'lng', value: string) {
    const next = [...coords];
    next[idx] = { ...next[idx], [field]: value };
    setCoords(next);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const data: Parameters<typeof onSubmit>[0] = {
      room_number: roomNumber.trim(),
      building_name: buildingName.trim(),
      floor_number: parseInt(floorNumber, 10),
      geofence_coordinates: coords
        .filter((c) => c.lat !== '' && c.lng !== '')
        .map((c) => ({ lat: parseFloat(c.lat), lng: parseFloat(c.lng) })),
    };
    if (baseAltitude.trim()) {
      data.base_altitude = parseFloat(baseAltitude);
    }
    onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Room Number" required error={fieldErrors.room_number}>
        <input
          className={inputClass}
          value={roomNumber}
          onChange={(e) => setRoomNumber(e.target.value)}
          placeholder="e.g. 301"
          required
        />
      </FormField>

      <FormField label="Building Name" required error={fieldErrors.building_name}>
        <input
          className={inputClass}
          value={buildingName}
          onChange={(e) => setBuildingName(e.target.value)}
          placeholder="e.g. Block A"
          required
        />
      </FormField>

      <FormField label="Floor Number" required error={fieldErrors.floor_number}>
        <input
          type="number"
          className={inputClass}
          value={floorNumber}
          onChange={(e) => setFloorNumber(e.target.value)}
          placeholder="e.g. 3"
          required
        />
      </FormField>

      <FormField label="Base Altitude (m)" error={fieldErrors.base_altitude}>
        <input
          type="number"
          step="any"
          className={inputClass}
          value={baseAltitude}
          onChange={(e) => setBaseAltitude(e.target.value)}
          placeholder="Optional"
        />
      </FormField>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Geofence Coordinates</span>
          <button
            type="button"
            onClick={addCoord}
            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
          >
            + Add Point
          </button>
        </div>
        {fieldErrors.geofence_coordinates && (
          <p className="text-xs text-red-600 mb-1">{fieldErrors.geofence_coordinates}</p>
        )}
        {coords.length === 0 && (
          <p className="text-xs text-gray-400">No coordinates added.</p>
        )}
        <div className="space-y-2">
          {coords.map((c, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                className={inputClass}
                value={c.lat}
                onChange={(e) => updateCoord(i, 'lat', e.target.value)}
                placeholder="Latitude"
              />
              <input
                type="number"
                step="any"
                className={inputClass}
                value={c.lng}
                onChange={(e) => updateCoord(i, 'lng', e.target.value)}
                placeholder="Longitude"
              />
              <button
                type="button"
                onClick={() => removeCoord(i)}
                className="text-danger-500 hover:text-danger-700 text-sm shrink-0"
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
