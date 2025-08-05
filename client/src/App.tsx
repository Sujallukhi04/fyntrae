import { Navigate, Route, Routes, useLocation } from "react-router";
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
import Time from "./pages/Dashboard/Time";
import Tag from "./pages/Dashboard/Tag";
import Detailed from "./pages/Dashboard/Detailed";
import Overview from "./pages/Dashboard/Overview";
import PermissionRoute from "./components/PermissionRoute";
import { useOrganization } from "./providers/OrganizationProvider";
import useTimesummary from "./hooks/useTimesummary";
import Shared from "./pages/Dashboard/Shared";
import ReportPublic from "./pages/ReportPublic";

const App = () => {
  const { isLoading, isAuthenticated } = useAuthUser();
  const { isLoading: orgLoading } = useOrganization();
  const { loading } = useTimesummary();
  const loader =
    Object.values(loading).some((v) => v === true) || orgLoading || isLoading;

  if (loader) return <LoaderMain />;

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
              <Route
                index
                element={
                  <PermissionRoute>
                    <DashMain />
                  </PermissionRoute>
                }
              />
              <Route
                path="time"
                element={
                  <PermissionRoute>
                    <Time />
                  </PermissionRoute>
                }
              />
              <Route
                path="teams/:orgId"
                element={
                  <PermissionRoute>
                    <TeamSetting />
                  </PermissionRoute>
                }
              />
              <Route
                path="teams/create"
                element={
                  <PermissionRoute>
                    <CreateOrg />
                  </PermissionRoute>
                }
              />
              <Route
                path="members"
                element={
                  <PermissionRoute>
                    <Members />
                  </PermissionRoute>
                }
              />
              <Route
                path="clients"
                element={
                  <PermissionRoute>
                    <Client />
                  </PermissionRoute>
                }
              />
              <Route
                path="projects"
                element={
                  <PermissionRoute>
                    <ProjectPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="project/:id"
                element={
                  <PermissionRoute>
                    <ProjectIdPage />
                  </PermissionRoute>
                }
              />
              <Route
                path="tags"
                element={
                  <PermissionRoute>
                    <Tag />
                  </PermissionRoute>
                }
              />
              <Route
                path="reporting/detailed"
                element={
                  <PermissionRoute>
                    <Detailed />
                  </PermissionRoute>
                }
              />
              <Route
                path="reporting/overview"
                element={
                  <PermissionRoute>
                    <Overview />
                  </PermissionRoute>
                }
              />
              <Route
                path="reporting/shared"
                element={
                  <PermissionRoute>
                    <Shared />
                  </PermissionRoute>
                }
              />
            </>
          )}
        </Route>

        <Route path="/team-invite/:token" element={<TeamInvite />} />

        <Route path="/public-report/:reportId" element={<ReportPublic />} />

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
