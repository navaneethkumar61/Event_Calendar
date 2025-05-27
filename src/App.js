// App.js
import React, { useState, useEffect } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  parseISO,
} from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import './App.css';

function App() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [events, setEvents] = useState(() => {
    const saved = localStorage.getItem('events');
    return saved ? JSON.parse(saved) : [];
  });
  const [formState, setFormState] = useState({
    title: '',
    time: '',
    description: '',
    recurrence: '',
    color: '#2196f3',
  });
  const [editingEvent, setEditingEvent] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [draggedEventId, setDraggedEventId] = useState(null);

  useEffect(() => {
    localStorage.setItem('events', JSON.stringify(events));
  }, [events]);

  const handleDateClick = (day) => {
    setSelectedDate(day);
    setEditingEvent(null);
    setFormState({ title: '', time: '', description: '', recurrence: '', color: '#2196f3' });
  };

  const handleEventClick = (event) => {
    setSelectedDate(parseISO(event.date));
    setEditingEvent(event);
    const time = format(parseISO(event.date), 'HH:mm');
    setFormState({
      title: event.title,
      time,
      description: event.description,
      recurrence: event.recurrence,
      color: event.color,
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!formState.title || !formState.time || !selectedDate) return;

    const dateString = `${format(selectedDate, 'yyyy-MM-dd')}T${formState.time}`;
    const conflict = events.find(
      (evt) => evt.date === dateString && (!editingEvent || evt.id !== editingEvent.id)
    );

    if (conflict) {
      alert('There is already an event scheduled at this date and time. Please choose another time.');
      return;
    }

    if (editingEvent) {
      const updatedEvents = events.map((evt) =>
        evt.id === editingEvent.id ? { ...editingEvent, ...formState, date: dateString } : evt
      );
      setEvents(updatedEvents);
    } else {
      const newEvent = {
        id: uuidv4(),
        title: formState.title,
        date: dateString,
        description: formState.description,
        recurrence: formState.recurrence,
        color: formState.color,
      };
      setEvents([...events, newEvent]);
    }
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event?')) return;
    setEvents(events.filter((evt) => evt.id !== eventId));
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const handleCancel = () => {
    setSelectedDate(null);
    setEditingEvent(null);
  };

  const handleDragStart = (e, eventId) => {
    e.dataTransfer.setData('text/plain', eventId);
    setDraggedEventId(eventId);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, dropDate) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData('text/plain');
    if (!eventId) return;

    const draggedEvent = events.find((evt) => evt.id === eventId);
    if (!draggedEvent) return;

    const oldTime = format(parseISO(draggedEvent.date), 'HH:mm');
    const newDateString = `${format(dropDate, 'yyyy-MM-dd')}T${oldTime}`;

    const conflict = events.find((evt) => evt.date === newDateString && evt.id !== eventId);
    if (conflict) {
      alert('Cannot move event: conflict detected with another event at that time.');
      setDraggedEventId(null);
      return;
    }

    const updatedEvents = events.map((evt) =>
      evt.id === eventId ? { ...evt, date: newDateString } : evt
    );
    setEvents(updatedEvents);
    setDraggedEventId(null);
  };

  const renderHeader = () => {
    const dateFormat = 'MMMM yyyy';
    return (
      <div className="header row flex-middle">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>{'<'}</button>
        <span><b>{format(currentMonth, dateFormat)}</b></span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>{'>'}</button>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const dateFormat = 'eeee';
    let startDate = startOfWeek(currentMonth);
    for (let i = 0; i < 7; i++) {
      days.push(<div className="column day" key={i}>{format(addDays(startDate, i), dateFormat)}</div>);
    }
    return <div className="days row">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const dayEvents = events.filter((evt) => isSameDay(parseISO(evt.date), cloneDay));
        days.push(
          <div
            className={`column cell ${!isSameMonth(day, monthStart) ? 'disabled' : isSameDay(day, new Date()) ? 'selected' : ''}`}
            key={day}
            onClick={() => handleDateClick(cloneDay)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, cloneDay)}
          >
            <span className="number">{format(day, 'd')}</span>
            <div className="events">
              {dayEvents.map((evt) => (
                <div
                  key={evt.id}
                  className="event-item"
                  style={{ backgroundColor: evt.color }}
                  draggable
                  onDragStart={(e) => handleDragStart(e, evt.id)}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventClick(evt);
                  }}
                >
                  {evt.title}
                </div>
              ))}
            </div>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(<div className="row" key={day}>{days}</div>);
      days = [];
    }
    return <div className="body">{rows}</div>;
  };

  return (
    <div className="calendar">
      {renderHeader()}
      {renderDays()}
      {renderCells()}

      {(selectedDate || editingEvent) && (
        <div className="modal">
          <form onSubmit={handleFormSubmit} className="event-form">
            <h3>{editingEvent ? 'Edit Event' : 'Add Event'}</h3>
            <label>Title:
              <input type="text" value={formState.title} onChange={(e) => setFormState({ ...formState, title: e.target.value })} required />
            </label>
            <label>Time (HH:MM AM/PM):
              <input type="time" value={formState.time} onChange={(e) => setFormState({ ...formState, time: e.target.value })} required />
            </label>
            <label>Description:
              <textarea value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
            </label>
            <label>Recurrence:
              <select value={formState.recurrence} onChange={(e) => setFormState({ ...formState, recurrence: e.target.value })}>
                <option value="">None</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <label>Color:
              <input type="color" value={formState.color} onChange={(e) => setFormState({ ...formState, color: e.target.value })} />
            </label>
            <div className="form-buttons">
              <button type="submit">{editingEvent ? 'Update' : 'Add'}</button>
              <button type="button" onClick={handleCancel}>Cancel</button>
              {editingEvent && <button type="button" onClick={() => handleDeleteEvent(editingEvent.id)}>Delete</button>}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

export default App;
