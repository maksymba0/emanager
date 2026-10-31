import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate } from 'react-router-dom'
import './index.css'
//import App from './App.tsx'
import { Routes,Route } from 'react-router-dom'

import { DashboardPage } from './pages/DashboardPage.tsx'
import { EmployeesPage } from './pages/EmployeesPage.tsx'
import { DepartmentsPage } from './pages/DepartmentsPage.tsx'
import { ShiftsPage } from './pages/ShiftsPage.tsx'
import { LoginPage } from './pages/LoginPage.tsx'
import { ProtectedRoute } from './pages/LoginPage.tsx'
import { NotFoundPage } from './pages/NotFoundPage.tsx'
import { LayoutPage } from './pages/LayoutPage.tsx'
import { TimeoffsPage } from './pages/TimeoffsPage.tsx'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Navigate to="/dashboard" replace />} />
        <Route path='/login' element={<LoginPage />}></Route>
        <Route element={<ProtectedRoute />}>
          <Route element={<LayoutPage/>}>
            <Route path='/dashboard' element={<DashboardPage />}></Route>
            <Route path='/departments' element={<DepartmentsPage />}></Route>
            <Route path='/employees' element={<EmployeesPage />}></Route>
            <Route path='/shifts' element={<ShiftsPage />}></Route>
            <Route path='/timeoffs' element={<TimeoffsPage />}></Route>
          </Route>
        </Route>
        <Route path='*' element={<NotFoundPage />}></Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
