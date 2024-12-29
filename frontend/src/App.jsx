import React from "react";
import SignUpPage from "./pages/signup/SignUpPage";
import HomePage from "./pages/home/HomePage";
import LogInPage from "./pages/login/LogInPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { Route, Routes } from "react-router-dom";
import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import NotificationPage from "./Notification/Notification";

function App() {
	return (
		<div className='flex max-w-6xl mx-auto'>
			{/* common components  because it is not inside Routes*/}
			<Sidebar />
			<Routes>
				<Route path='/' element={<HomePage />} />
				<Route path='/signup' element={<SignUpPage />} />
				<Route path='/login' element={<LogInPage />} />
				<Route path='*' element={<h1>Not Found</h1>} />
				<Route path="/notification"  element= {<NotificationPage />} />
				<Route path = "/profile/:username" element = {<ProfilePage />} />
			</Routes>
			<RightPanel />
		</div>
	);
}

export default App;
