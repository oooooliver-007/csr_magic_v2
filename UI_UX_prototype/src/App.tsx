/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { EmployeeApp } from './components/EmployeeApp';
import { AdminApp } from './components/AdminApp';

export default function App() {
  const [userRole, setUserRole] = useState<'guest' | 'employee' | 'admin'>('guest');

  if (userRole === 'guest') {
    return <LoginPage onLogin={setUserRole} />;
  }

  if (userRole === 'employee') {
    return <EmployeeApp />;
  }

  if (userRole === 'admin') {
    return <AdminApp />;
  }

  return null;
}

