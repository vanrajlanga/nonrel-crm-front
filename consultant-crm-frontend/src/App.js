import './App.css';
import Layout from "./components/Layout/Layout";
import Toast from './components/common/Toast';

function App() {
  return (
    <>
      <Toast.ToastContainer />
      <Layout/>
    </>
  );
}

export default App;
