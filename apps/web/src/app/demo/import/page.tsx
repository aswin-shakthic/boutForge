export default function DemoImportPage() {
  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-navy">Import Fighters</h1>

      <div className="card space-y-4">
        <p className="text-sm text-gray-500">
          Upload CSV with columns: <code className="bg-gray-100 px-1 rounded">name, dob, gender, weight_kg</code>
        </p>

        <div className="bg-gray-50 p-4 rounded-lg text-xs font-mono text-gray-600">
          name,dob,gender,weight_kg<br />
          Rahul Sharma,2008-03-15,male,58<br />
          Amit Patel,2009-07-22,male,59<br />
          Vikram Singh,2008-05-10,male,60<br />
          Suresh Nair,2009-01-08,male,57<br />
          Karan Mehta,2010-11-03,male,58
        </div>

        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center text-gray-400 text-sm">
          Drop CSV file here or click to browse
        </div>

        <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm">
          Sample import result: 5 fighters imported, 0 errors
        </div>
      </div>
    </div>
  );
}
