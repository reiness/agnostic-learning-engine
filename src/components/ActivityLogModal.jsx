import React, { useState, useEffect } from 'react';
import { getActivityLogs, getActivityLogCount } from '../services/activityService';
import Spinner from './Spinner';

const ActivityLogModal = ({ userId, userEmail, onClose }) => {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageDocs, setPageDocs] = useState({});
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetchInitialData = async () => {
      const count = await getActivityLogCount(userId);
      setTotalPages(Math.ceil(count / 10));
      fetchLogs();
    };
    fetchInitialData();
  }, [userId, page]);

  const fetchLogs = async () => {
    setIsLoading(true);
    const { logs: newLogs, lastVisible } = await getActivityLogs(userId, pageDocs[page]);
    setLogs(newLogs);
    setPageDocs(prev => ({ ...prev, [page + 1]: lastVisible }));
    setIsLoading(false);
  };

  const handleNextPage = () => {
    setPage(prev => prev + 1);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(1, prev - 1));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl">
        <h2 className="text-2xl font-bold mb-4">{userEmail} Full Activity Log</h2>
        <div className="overflow-y-auto h-96">
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-4 border-b">Timestamp</th>
                <th className="py-2 px-4 border-b">Action</th>
                <th className="py-2 px-4 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td className="py-2 px-4 border-b">{new Date(log.timestamp.seconds * 1000).toLocaleString()}</td>
                  <td className="py-2 px-4 border-b">{log.action}</td>
                  <td className="py-2 px-4 border-b">{JSON.stringify(log.details)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {isLoading && <Spinner />}
        </div>
        <div className="flex justify-between mt-4">
          <button onClick={handlePrevPage} disabled={page === 1} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400">Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={handleNextPage} disabled={page === totalPages} className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400">Next</button>
        </div>
        <button onClick={onClose} className="mt-4 bg-red-500 text-white px-4 py-2 rounded">Close</button>
      </div>
    </div>
  );
};

export default ActivityLogModal;