import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './styles/index.css'
import { AppShell } from './app/AppShell'
import { ToastProvider } from './components/toast'
import Overview from './pages/Overview'
import Learn from './pages/Learn'
import ResourcePage from './pages/ResourcePage'
import Viewer from './pages/Viewer'
import Practice from './pages/Practice'
import TaskPage from './pages/TaskPage'
import Flashcards from './pages/Flashcards'
import FlashcardStudy from './pages/FlashcardStudy'
import Review from './pages/Review'
import Library from './pages/Library'
import Settings from './pages/Settings'
import Classroom from './pages/Classroom'
import Subject from './pages/Subject'
import Logbook from './pages/Logbook'
import Announcements from './pages/Announcements'
import Tests from './pages/Tests'
import TestRun from './pages/TestRun'
import TestResult from './pages/TestResult'
import NotFound from './pages/NotFound'

const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Overview /> },
      { path: '/learn', element: <Learn /> },
      { path: '/learn/:id', element: <ResourcePage /> },
      { path: '/view', element: <Viewer /> },
      { path: '/practice', element: <Practice /> },
      { path: '/practice/:id', element: <TaskPage /> },
      { path: '/flashcards', element: <Flashcards /> },
      { path: '/flashcards/:deckId', element: <FlashcardStudy /> },
      { path: '/review', element: <Review /> },
      { path: '/tests', element: <Tests /> },
      { path: '/classroom', element: <Classroom /> },
      { path: '/logbook', element: <Logbook /> },
      { path: '/announcements', element: <Announcements /> },
      { path: '/classroom/:courseId', element: <Classroom /> },
      { path: '/subjects/:id', element: <Subject /> },
      { path: '/tests/:testId', element: <TestRun /> },
      { path: '/tests/:testId/results/:attemptId', element: <TestResult /> },
      { path: '/library/:category', element: <Library /> },
      { path: '/settings', element: <Settings /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </StrictMode>,
)
