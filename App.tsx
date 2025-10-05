import React, { useState, DragEvent, useEffect, MouseEvent as ReactMouseEvent, useCallback, useRef } from 'react';
import { EisenhowerMatrix, Calendar, CompletedTasks, TaskInput } from './components/IconCard';
import { Task, QuadrantName } from './types';

function App() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: '1', text: 'Projektbericht fertigstellen', quadrant: 'do', completed: false, scheduledTime: 8, duration: 3 },
    { id: '2', text: 'Zahnarzttermin vereinbaren', quadrant: 'schedule', completed: false, scheduledTime: null, duration: 1 },
    { id: '3', text: 'E-Mails sortieren', quadrant: 'delegate', completed: false, scheduledTime: 10.5, duration: 1 },
    { id: '4', text: 'Social Media scrollen', quadrant: 'delete', completed: true, scheduledTime: null, duration: 1 },
    { id: '5', text: 'Kurzer Check-In Call', quadrant: 'do', completed: false, scheduledTime: 9.5, duration: 0.5 },
  ]);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [resizingTask, setResizingTask] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);


  const handleAddTask = (text: string) => {
    if (text.trim() === '') return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      text,
      quadrant: 'schedule', // Standardquadrant
      completed: false,
      scheduledTime: null,
      duration: 1, // Standarddauer von 1 Stunde
    };
    setTasks(prev => [...prev, newTask]);
  };

  const toggleTaskCompletion = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed, scheduledTime: task.completed ? task.scheduledTime : null } : task
      )
    );
  };

  const handleDragStart = (e: DragEvent<HTMLDivElement>, id: string) => {
    setDraggedTaskId(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (quadrant: QuadrantName | null, time: number | null) => {
    if (!draggedTaskId) return;

    setTasks(prev =>
      prev.map(task => {
        if (task.id === draggedTaskId) {
          const isMovingToCalendar = time !== null;
          return {
            ...task,
            quadrant: quadrant ?? task.quadrant,
            scheduledTime: isMovingToCalendar ? time : task.scheduledTime, // Behält die Zeit bei, wenn nur der Quadrant geändert wird
          };
        }
        return task;
      })
    );
    setDraggedTaskId(null);
  };

  const handleResizeStart = (e: ReactMouseEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingTask(id);
  };
  
  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizingTask || !calendarRef.current) return;
    
    const task = tasks.find(t => t.id === resizingTask);
    if (!task || task.scheduledTime === null) return;

    const calendarRect = calendarRef.current.getBoundingClientRect();
    const mouseY = e.clientY - calendarRect.top;

    const HOUR_HEIGHT = 60; // Muss mit der CSS-Höhe in Calendar übereinstimmen
    const taskStartTop = (task.scheduledTime - 7) * HOUR_HEIGHT;

    const newHeight = Math.max(mouseY - taskStartTop, HOUR_HEIGHT / 2); // Mindesthöhe 30px (0.5h)

    // Auf die nächste halbe Stunde runden
    const newDuration = Math.max(0.5, Math.round(newHeight / (HOUR_HEIGHT / 2)) * 0.5);

    // Verhindern, dass die Größe über das Ende des Kalenders hinausgeht (letzter Slot ist 19:00, Ende ist 20:00)
    if (task.scheduledTime + newDuration > 20) {
      return;
    }

    setTasks(prev =>
      prev.map(t =>
        t.id === resizingTask ? { ...t, duration: newDuration } : t
      )
    );
  }, [resizingTask, tasks]);

  const handleResizeEnd = useCallback(() => {
    setResizingTask(null);
  }, []);

  useEffect(() => {
    if (resizingTask) {
      window.addEventListener('mousemove', handleResize);
      window.addEventListener('mouseup', handleResizeEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleResize);
      window.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizingTask, handleResize, handleResizeEnd]);


  const activeTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8 font-sans">
      <header className="w-full max-w-7xl mx-auto mb-8">
        <h1 className="text-5xl font-bold text-slate-900">
          Tagesplaner
        </h1>
      </header>

      <main className="w-full max-w-7xl mx-auto flex-grow">
        <TaskInput onAddTask={handleAddTask} />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          <div className="flex flex-col gap-8">
            <EisenhowerMatrix 
              tasks={activeTasks} 
              onDrop={handleDrop} 
              onDragOver={handleDragOver}
              onDragStart={handleDragStart}
              onToggleComplete={toggleTaskCompletion}
            />
            <CompletedTasks 
              tasks={completedTasks} 
              onToggleComplete={toggleTaskCompletion}
            />
          </div>

          <Calendar 
            calendarRef={calendarRef}
            tasks={activeTasks}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragStart={handleDragStart}
            onToggleComplete={toggleTaskCompletion}
            onResizeStart={handleResizeStart}
          />
        </div>
      </main>

      <footer className="w-full max-w-7xl mx-auto text-center py-6 mt-10">
        <p className="text-slate-500">
          Strukturiert durch die Eisenhower-Matrix
        </p>
      </footer>
    </div>
  );
}

export default App;