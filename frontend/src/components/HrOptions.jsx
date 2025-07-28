import { Link } from 'react-router-dom';

function HrOptions() {
  return (
    <div>
      <main 
        className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 sm:p-8"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1449157291145-7efd050a4d0e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 sm:p-8 text-center">
          <h2 className="text-2xl font-bold text-blue-600 mb-6">HR Options</h2>
          <p className="text-gray-600 mb-6">
            Are you an HR professional looking to manage job postings?
          </p>
          <div className="space-y-4">
            <Link
              to="/register/hr"
              className="block w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-green-500 transition-colors"
            >
              Register Now
            </Link>
            <Link
              to="/login"
              className="block w-full bg-orange-500 text-gray-600 px-4 py-2 rounded hover:bg-green-500 hover:text-white transition-colors"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HrOptions;