import React, { DragEvent, FormEvent, useState, MouseEvent as ReactMouseEvent } from 'react';
import { Task, QuadrantName } from '../types';
import { FireIcon, CalendarDaysIcon, UsersIcon, TrashIcon, ClockIcon, PlusIcon, CheckIcon } from './Icons';

// ========== Helpers ==========
const formatTime = (time: number): string => {
    const hour = Math.floor(time);
    const minutes = (time % 1) * 60;
    return `${hour}:${minutes.toString().padStart(2, '0')}`;
};


// ========== Task Input ==========

interface TaskInputProps {
  onAddTask: (text: string) => void;
}

export const TaskInput: React.FC<TaskInputProps> = ({ onAddTask }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onAddTask(inputValue);
    setInputValue('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-3">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Neue Aufgabe..."
        className="flex-grow bg-white border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-sm"
        aria-label="Neue Aufgabe"
      />
      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-sm hover:shadow-md" aria-label="Aufgabe hinzufügen">
        <PlusIcon className="w-5 h-5" />
        <span>Hinzufügen</span>
      </button>
    </form>
  );
};

// ========== Custom Checkbox ==========
interface CustomCheckboxProps {
    checked: boolean;
    onChange: () => void;
    color: string;
}

const CustomCheckbox: React.FC<CustomCheckboxProps> = ({ checked, onChange, color }) => {
    return (
        <div 
            onClick={onChange}
            className={`w-6 h-6 flex-shrink-0 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 border-2 ${checked ? `${color} border-transparent` : 'border-slate-300 hover:border-slate-400 bg-transparent'}`}
            aria-checked={checked}
            role="checkbox"
        >
            {checked && <CheckIcon className="w-4 h-4 text-white" />}
        </div>
    );
};


// ========== Task Item (for Matrix) ==========

interface TaskItemProps {
  task: Task;
  onToggleComplete: (id: string) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggleComplete, onDragStart }) => {
  const isScheduled = task.scheduledTime !== null;
  
  const quadrantColors: Record<QuadrantName, { checkbox: string }> = {
    do: { checkbox: 'bg-rose-500' },
    schedule: { checkbox: 'bg-emerald-500' },
    delegate: { checkbox: 'bg-amber-500' },
    delete: { checkbox: 'bg-slate-500' },
  };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="p-3 rounded-xl flex items-center gap-4 cursor-grab active:cursor-grabbing transition-all duration-200 bg-white hover:bg-slate-50"
      title={isScheduled ? `Geplant für ${formatTime(task.scheduledTime)} Uhr` : 'Noch nicht geplant'}
    >
      <CustomCheckbox 
        checked={task.completed} 
        onChange={() => onToggleComplete(task.id)}
        color={quadrantColors[task.quadrant].checkbox}
      />
      <p id={`task-text-${task.id}`} className={`flex-grow text-sm transition-colors ${task.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
        {task.text}
      </p>
      {isScheduled && !task.completed && (
         <ClockIcon className="w-4 h-4 text-blue-500 flex-shrink-0" title={`Geplant für ${formatTime(task.scheduledTime)} Uhr`} />
      )}
    </div>
  );
};


// ========== Eisenhower Matrix ==========

interface QuadrantProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  quadrant: QuadrantName;
  onDrop: (quadrant: QuadrantName, time: null) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  children: React.ReactNode;
  bgColor: string;
}

const Quadrant: React.FC<QuadrantProps> = ({ title, description, icon, quadrant, onDrop, onDragOver, children, bgColor }) => {
    const [isDragOver, setIsDragOver] = useState(false);

    return (
        <div
            onDrop={(e) => { e.preventDefault(); setIsDragOver(false); onDrop(quadrant, null); }}
            onDragOver={(e) => { onDragOver(e); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            className={`p-4 rounded-2xl transition-all duration-300 min-h-[180px] ${isDragOver ? `${bgColor} ring-2 ring-blue-400` : `bg-slate-100/50`}`}
        >
            <div className="flex items-center gap-3 mb-4">
                {icon}
                <div>
                    <h3 className="font-semibold text-slate-800">{title}</h3>
                    <p className="text-xs text-slate-500">{description}</p>
                </div>
            </div>
            <div className="space-y-2">{children}</div>
        </div>
    );
};


interface EisenhowerMatrixProps {
  tasks: Task[];
  onDrop: (quadrant: QuadrantName, time: null) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const EisenhowerMatrix: React.FC<EisenhowerMatrixProps> = ({ tasks, onDrop, onDragOver, onDragStart, onToggleComplete }) => {
  const quadrants: { name: QuadrantName; title: string; description: string; icon: React.ReactNode, bgColor: string }[] = [
    { name: 'do', title: 'Wichtig & Dringend', description: 'Sofort erledigen', icon: <FireIcon className="w-6 h-6 text-rose-500" />, bgColor: "bg-rose-100" },
    { name: 'schedule', title: 'Wichtig & Nicht Dringend', description: 'Planen & terminieren', icon: <CalendarDaysIcon className="w-6 h-6 text-emerald-500" />, bgColor: "bg-emerald-100" },
    { name: 'delegate', title: 'Nicht Wichtig & Dringend', description: 'Delegieren', icon: <UsersIcon className="w-6 h-6 text-amber-500" />, bgColor: "bg-amber-100" },
    { name: 'delete', title: 'Nicht Wichtig & Nicht Dringend', description: 'Verwerfen', icon: <TrashIcon className="w-6 h-6 text-slate-500" />, bgColor: "bg-slate-200" },
  ];

  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/80">
        <h2 className="text-2xl font-bold mb-6 px-2 text-slate-800">Eisenhower-Matrix</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {quadrants.map(({ name, title, description, icon, bgColor }) => (
            <Quadrant
            key={name}
            title={title}
            description={description}
            icon={icon}
            quadrant={name}
            onDrop={onDrop}
            onDragOver={onDragOver}
            bgColor={bgColor}
            >
            {tasks
                .filter(task => task.quadrant === name)
                .map(task => (
                <TaskItem key={task.id} task={task} onToggleComplete={onToggleComplete} onDragStart={onDragStart} />
                ))}
            </Quadrant>
        ))}
        </div>
    </div>
  );
};


// ========== Calendar ==========

const HOUR_HEIGHT = 60; // Höhe einer Stunde in Pixeln

interface CalendarTaskItemProps {
    task: Task;
    onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
    onResizeStart: (e: ReactMouseEvent<HTMLDivElement>, id: string) => void;
}

const CalendarTaskItem: React.FC<CalendarTaskItemProps> = ({ task, onDragStart, onResizeStart }) => {
    if (task.scheduledTime === null) return null;

    const top = (task.scheduledTime - 7) * HOUR_HEIGHT;
    const height = task.duration * HOUR_HEIGHT;
    const endTime = task.scheduledTime + task.duration;

    const quadrantColors: Record<QuadrantName, { bg: string, text: string, border: string, handle: string }> = {
        do:       { bg: 'bg-rose-100',   text: 'text-rose-900',   border: 'border-rose-200',   handle: 'bg-rose-300' },
        schedule: { bg: 'bg-emerald-100', text: 'text-emerald-900', border: 'border-emerald-200', handle: 'bg-emerald-300' },
        delegate: { bg: 'bg-amber-100',  text: 'text-amber-900',  border: 'border-amber-200',  handle: 'bg-amber-300' },
        delete:   { bg: 'bg-slate-100',  text: 'text-slate-700',  border: 'border-slate-200',  handle: 'bg-slate-300' },
    };
    
    const colors = quadrantColors[task.quadrant];
    const isShortTask = task.duration <= 0.5;

    return (
        <div
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            style={{ top: `${top}px`, height: `${height}px` }}
            className={`absolute left-14 right-2 rounded-lg p-2 flex border shadow-sm cursor-grab active:cursor-grabbing group transition-opacity duration-300 ${colors.bg} ${colors.text} ${colors.border}`}
        >
            <div className={`flex w-full ${isShortTask ? 'items-center justify-between' : 'flex-col justify-start'}`}>
                <p className="font-semibold text-sm truncate" title={task.text}>{task.text}</p>
                 <p className={`text-xs ${isShortTask ? '' : 'opacity-80'}`}>{`${formatTime(task.scheduledTime)} - ${formatTime(endTime)}`}</p>
            </div>
            
            <div 
                onMouseDown={(e) => onResizeStart(e, task.id)}
                className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full cursor-ns-resize opacity-0 group-hover:opacity-100 transition-colors hover:bg-opacity-80 ${colors.handle}`}
            />
        </div>
    );
};

interface CalendarProps {
    tasks: Task[];
    onDrop: (quadrant: null, time: number) => void;
    onDragOver: (e: DragEvent<HTMLDivElement>) => void;
    onDragStart: (e: DragEvent<HTMLDivElement>, id: string) => void;
    onToggleComplete: (id: string) => void;
    onResizeStart: (e: ReactMouseEvent<HTMLDivElement>, id: string) => void;
    calendarRef: React.RefObject<HTMLDivElement>;
}

export const Calendar: React.FC<CalendarProps> = ({ tasks, onDrop, onDragOver, onDragStart, onResizeStart, calendarRef }) => {
  const hours = Array.from({ length: 13 }, (_, i) => i + 7); // 7am to 7pm (19:00)

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!calendarRef.current) return;

    const rect = calendarRef.current.getBoundingClientRect();
    const dropY = e.clientY - rect.top;

    const timeSlot = Math.round(dropY / (HOUR_HEIGHT / 2)) * 0.5;
    const newTime = timeSlot + 7;

    const clampedTime = Math.max(7, Math.min(19.5, newTime));

    onDrop(null, clampedTime);
  };
  
  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/80">
      <h2 className="text-2xl font-bold mb-6 px-2 text-slate-800">Tagesplan</h2>
      <div 
        ref={calendarRef}
        onDrop={handleDrop}
        onDragOver={onDragOver}
        className="relative"
      >
        {hours.map(hour => (
            <div key={hour} className="relative" style={{ height: `${HOUR_HEIGHT}px`}}>
              <div className="absolute left-0 top-0 -translate-y-1/2 w-14 text-right text-xs text-slate-400 pr-2">{hour}:00</div>
              <div className="h-full border-t border-slate-200 ml-14">
                  <div className="h-1/2 w-full border-b border-dashed border-slate-200"></div>
              </div>
            </div>
        ))}

        {tasks
            .filter(t => t.scheduledTime !== null && !t.completed)
            .map(task => (
                <CalendarTaskItem 
                    key={task.id}
                    task={task}
                    onDragStart={onDragStart}
                    onResizeStart={onResizeStart}
                />
        ))}
      </div>
    </div>
  );
};


// ========== Completed Tasks ==========

interface CompletedTasksProps {
  tasks: Task[];
  onToggleComplete: (id: string) => void;
}

export const CompletedTasks: React.FC<CompletedTasksProps> = ({ tasks, onToggleComplete }) => {
  return (
    <div className="bg-white p-6 rounded-3xl shadow-lg border border-slate-200/80">
      <h2 className="text-2xl font-bold mb-6 px-2 text-slate-800">Erledigt</h2>
      <div className="space-y-2">
        {tasks.length > 0 ? (
          tasks.map(task => (
            <div key={task.id} className="p-3 bg-slate-100/80 rounded-xl flex items-center gap-4">
                 <CustomCheckbox
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    color="bg-slate-500"
                 />
                <p id={`task-text-completed-${task.id}`} className="flex-grow line-through text-slate-400 text-sm">{task.text}</p>
            </div>
          ))
        ) : (
          <p className="text-slate-400 px-2 text-sm">Noch keine Aufgaben erledigt.</p>
        )}
      </div>
    </div>
  );
};