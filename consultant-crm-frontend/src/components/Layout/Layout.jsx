import React from 'react'
import Header from '../Header/Header'
import Router from '../../Router/Routers'
import Footer from '../Footer/Footer'
import './Layout.css'

const Layout = () => { 
  return (
    <div className="layout">
        <header className="layout__header">
            <Header/>
        </header>
        <main className="layout__main">
            <Router/>
        </main>
        <footer className="layout__footer">
            <Footer/>
        </footer>
    </div>
  )
}

export default Layout;