import { Navigate, Route, Routes } from "react-router";
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import useAuthUser from "./hooks/useAuthUser";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard/Dashboard";
import Profile from "./pages/Profile";
import TeamSetting from "./pages/Dashboard/TeamSetting";
import DashMain from "./pages/Dashboard/DashMain";
import NotFound from "./pages/NotFound";
import { Toaster } from "sonner";
import { LoaderMain } from "./components/Loader";
import CreateOrg from "./pages/Dashboard/CreateOrg";
import Members from "./pages/Dashboard/Members";
import { TeamInvite } from "./pages/AcceptInvite";
import Client from "./pages/Dashboard/Client";
import ProjectPage from "./pages/Dashboard/Project";
import ProjectIdPage from "./pages/Dashboard/ProjectPage";

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
              <Route path="clients" element={<Client />} />
              <Route path="projects" element={<ProjectPage />} />
              <Route path="project/:id" element={<ProjectIdPage />} />
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
      <Toaster richColors theme="dark" />
    </div>
  );
};

export default App;
