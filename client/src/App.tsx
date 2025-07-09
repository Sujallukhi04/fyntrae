import { Navigate, Route, Routes } from "react-router";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import useAuthUser from "./hooks/useAuthUser";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import TeamSetting from "./pages/TeamSetting";
import DashMain from "./pages/DashMain";
import NotFound from "./pages/NotFound";
import { Toaster } from "sonner";
import { LoaderMain } from "./components/Loader";
import CreateOrg from "./pages/CreateOrg";
import Members from "./pages/Members";
import { TeamInvite } from "./pages/AcceptInvite";

const App = () => {
  const { isLoading, isAuthenticated, user } = useAuthUser();
  console.log(user);
  if (isLoading) return <LoaderMain />;
  return (
    <div>
      <Routes>
        <Route
          path="/"
          element={
            !isAuthenticated ? (
              <Home />
            ) : (
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            )
          }
        >
          {isAuthenticated && (
            <>
              <Route index element={<DashMain />} />
              <Route path="teams/:orgId" element={<TeamSetting />} />
              <Route path="teams/create" element={<CreateOrg />} />
              <Route path="members" element={<Members />} />
            </>
          )}
        </Route>

        <Route path="/team-invite/:token" element={<TeamInvite />} />

        <Route
          path="/signup"
          element={!isAuthenticated ? <Signup /> : <Navigate to={"/"} />}
        />
        <Route
          path="/login"
          element={!isAuthenticated ? <Login /> : <Navigate to={"/"} />}
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
