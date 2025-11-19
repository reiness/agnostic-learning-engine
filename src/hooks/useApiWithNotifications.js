import { useState } from 'react';
import { toastService } from '../services/toastService';
import logger from '../utils/logger';

/**
 * @callback ApiCallback
 * @param {...any} args - The arguments for the API call.
 * @returns {Promise<any>} A promise that resolves with the API call's result.
 */

/**
 * @typedef {object} UseApiWithNotificationsResult
 * @property {(...args: any[]) => Promise<any>} call - The function to trigger the API call.
 * @property {boolean} loading - Whether the API call is in progress.
 * @property {any} data - The data returned from the API call.
 * @property {Error|null} error - The error returned from the API call.
 */

/**
 * A custom hook to handle API calls with toast notifications for success and error states.
 *
 * @param {ApiCallback} apiCall - The async function to call.
 * @param {object} [options] - Optional configuration.
 * @param {string} [options.successMessage] - The message to display on success.
 * @param {string} [options.errorMessage] - The message to display on error.
 * @returns {UseApiWithNotificationsResult} - An object containing the call function, loading state, data, and error.
 */
export const useApiWithNotifications = (apiCall, options = {}) => {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const call = async (...args) => {
    setLoading(true);
    setData(null);
    setError(null);

    const toastId = toastService.showLoading('Processing...');

    try {
      const result = await apiCall(...args);
      setData(result);
      toastService.update(toastId, options.successMessage || 'Operation successful!', 'success');
      return result;
    } catch (err) {
      setError(err);
      // Use the global service to show the error, which will replace the loading toast.
      toastService.update(toastId, options.errorMessage || `An error occurred: ${err.message}`, 'error');
      logger.error('API call failed:', err); // Keep the error logger for production monitoring
      throw err; // Re-throw the error to be caught by the caller if needed
    } finally {
      setLoading(false);
    }
  };

  return { call, loading, data, error };
};