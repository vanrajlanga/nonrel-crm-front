import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const defaultConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
  theme: "light"
};

const Toast = {
  success: (message) => {
    toast.success(message, defaultConfig);
  },
  
  error: (message) => {
    toast.error(message, defaultConfig);
  },

  warning: (message) => {
    toast.warning(message, defaultConfig);
  },

  info: (message) => {
    toast.info(message, defaultConfig);
  },

  // Export ToastContainer with consistent configuration
  ToastContainer: () => (
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
    />
  )
};

export default Toast; 