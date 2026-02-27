import { CsvUpload } from '@/components/csv-upload';

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">CSV Import</h1>
        <p className="text-sm text-[#737373] mt-0.5">
          Bulk import students, teachers, or timetable entries from a CSV file
        </p>
      </div>
      <CsvUpload />
    </div>
  );
}
