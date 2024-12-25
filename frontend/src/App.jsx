import React from "react";
import SignUpPage from "./pages/signup/SignUpPage";
import HomePage from "./pages/home/HomePage";
import LogInPage from "./pages/login/LogInPage";
import { Route, Routes } from "react-router-dom";

function App() {
	return (
		<div className='flex max-w-6xl mx-auto'>
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/signup' element={<SignUpPage />} />
				<Route path='/login' element={<LogInPage />} />
			</Routes>
		</div>
	);
}

export default App;
