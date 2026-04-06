import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const API_URL = '/api/employees';

function Dashboard() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Está seguro de eliminar este empleado?')) return;
    
    try {
      const res = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete');
      setEmployees(employees.filter(e => e.id !== id));
    } catch (err) {
      alert('Error al eliminar: ' + err.message);
    }
  };

  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const inactiveCount = employees.filter(e => e.status === 'INACTIVE').length;

  if (loading) return <div className="text-center py-8">Cargando...</div>;
  if (error) return <div className="text-red-500 py-8">Error: {error}</div>;

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold">{employees.length}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Activos</p>
          <p className="text-2xl font-bold text-success">{activeCount}</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <p className="text-sm text-gray-500">Inactivos</p>
          <p className="text-2xl font-bold text-gray-400">{inactiveCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-lg font-semibold">Lista de Empleados</h2>
          <Link
            to="/employee/new"
            className="bg-primary text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            + Nuevo Empleado
          </Link>
        </div>

        {employees.length === 0 ? (
          <p className="p-8 text-center text-gray-500">No hay empleados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Departamento</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Cargo</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {employees.map(employee => (
                  <tr key={employee.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">{employee.name}</td>
                    <td className="px-4 py-3 text-gray-500">{employee.email}</td>
                    <td className="px-4 py-3">{employee.department}</td>
                    <td className="px-4 py-3">{employee.position}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        employee.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {employee.status === 'ACTIVE' ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        to={`/employee/${employee.id}/edit`}
                        className="text-primary hover:underline mr-3"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(employee.id)}
                        className="text-danger hover:underline"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
