import { Navigate, Route, Routes } from "react-router";
import { Suspense, lazy } from "react";
import { Toaster } from "sonner";
import { LoaderMain } from "./components/Loader";
import useAuthUser from "./hooks/useAuthUser";
import ProtectedRoute from "./components/ProtectedRoute";
import PermissionRoute from "./components/PermissionRoute";
import { useOrganization } from "./providers/OrganizationProvider";
import useTimesummary from "./hooks/useTimesummary";

// 🔹 Lazy-loaded pages
const Home = lazy(() => import("./pages/Home"));
const Signup = lazy(() => import("./pages/Signup"));
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const TeamSetting = lazy(() => import("./pages/Dashboard/TeamSetting"));
const DashMain = lazy(() => import("./pages/Dashboard/DashMain"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CreateOrg = lazy(() => import("./pages/Dashboard/CreateOrg"));
const Members = lazy(() => import("./pages/Dashboard/Members"));
const TeamInvite = lazy(() =>
  import("./pages/AcceptInvite").then((m) => ({ default: m.TeamInvite }))
);
const Client = lazy(() => import("./pages/Dashboard/Client"));
const ProjectPage = lazy(() => import("./pages/Dashboard/Project"));
const ProjectIdPage = lazy(() => import("./pages/Dashboard/ProjectPage"));
const Time = lazy(() => import("./pages/Dashboard/Time"));
const Tag = lazy(() => import("./pages/Dashboard/Tag"));
const Detailed = lazy(() => import("./pages/Dashboard/Detailed"));
const Overview = lazy(() => import("./pages/Dashboard/Overview"));
const Shared = lazy(() => import("./pages/Dashboard/Shared"));
const ReportPublic = lazy(() => import("./pages/ReportPublic"));
const VerifyPage = lazy(() => import("./pages/Verification"));
const Reset = lazy(() => import("./pages/Reset"));
const SetNewPassword = lazy(() => import("./pages/NewPassword"));
const RateLimit = lazy(() => import("./pages/RateLimit"));

const App = () => {
  const { isLoading, isAuthenticated } = useAuthUser();
  const { isLoading: orgLoading } = useOrganization();
  const { loading } = useTimesummary();

  const loader =
    Object.values(loading).some((v) => v === true) || orgLoading || isLoading;

  if (loader) return <LoaderMain />;

  return (
    <div>
      <Suspense fallback={<LoaderMain />}>
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
                  path="user/profile"
                  element={
                    <PermissionRoute>
                      <Profile />
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
            path="/verify-email"
            element={!isAuthenticated ? <VerifyPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/reset"
            element={!isAuthenticated ? <Reset /> : <Navigate to={"/"} />}
          />
          <Route
            path="/new-password"
            element={
              !isAuthenticated ? <SetNewPassword /> : <Navigate to={"/"} />
            }
          />
          <Route path="/rate-limit" element={<RateLimit />} />

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
      </Suspense>

      <Toaster richColors theme="dark" />
    </div>
  );
};

export default App;
