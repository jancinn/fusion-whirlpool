import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Calendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    // Helper to get days in month
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const days = new Date(year, month + 1, 0).getDate();
        const firstDay = new Date(year, month, 1).getDay();
        return { days, firstDay };
    };

    // Fetch events from Supabase
    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                // Get start and end of current month view
                const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).toISOString();
                const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).toISOString();

                const { data, error } = await supabase
                    .from('solicitudes')
                    .select('*');
                // .gte('event_date', startOfMonth)
                // .lte('event_date', endOfMonth);

                if (error) throw error;
                setEvents(data || []);
            } catch (error) {
                console.error('Error fetching events:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchEvents();
    }, [currentDate]);

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const { days, firstDay } = getDaysInMonth(currentDate);
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    // Helper to check if a day has events
    const getEventsForDay = (day) => {
        return events.filter(event => {
            if (!event.event_date) return false;
            // Normalize event date to YYYY-MM-DD
            const eventDateStr = event.event_date.split('T')[0];

            const dayString = day.toString().padStart(2, '0');
            const monthString = (currentDate.getMonth() + 1).toString().padStart(2, '0');
            const yearString = currentDate.getFullYear();
            const currentDayStr = `${yearString}-${monthString}-${dayString}`;

            return eventDateStr === currentDayStr;
        });
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', color: 'var(--text-main)', margin: 0 }}>Calendario Maestro</h1>
                    <p style={{ color: 'var(--text-secondary)' }}>Eventos y actividades programadas</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-sm)', border: '1px solid var(--border-light)' }}>
                    <button
                        onClick={prevMonth}
                        className="btn-icon"
                        title="Mes Anterior"
                    >
                        <ChevronLeft />
                    </button>
                    <span style={{ fontSize: '1.25rem', fontWeight: '600', minWidth: '150px', textAlign: 'center', color: 'var(--text-main)' }}>
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </span>
                    <button
                        onClick={nextMonth}
                        className="btn-icon"
                        title="Mes Siguiente"
                    >
                        <ChevronRight />
                    </button>
                </div>
            </div>

            {/* Calendar Grid (Desktop) */}
            <div className="card desktop-only" style={{ padding: '1.5rem' }}>
                <div className="calendar-container">

                    {/* Weekday Headers */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: '1rem', textAlign: 'center' }}>
                        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
                            <div key={day} className="calendar-header-text" style={{ fontWeight: '600', color: 'var(--text-secondary)', padding: '0.5rem' }}>
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Days Grid */}
                    <div className="calendar-grid">

                        {/* Empty cells for days before start of month */}
                        {Array.from({ length: firstDay }).map((_, index) => (
                            <div key={`empty-${index}`} className="calendar-day" style={{ backgroundColor: 'var(--bg-body)', minHeight: '120px' }}></div>
                        ))}

                        {/* Actual days */}
                        {Array.from({ length: days }).map((_, index) => {
                            const day = index + 1;
                            const dayEvents = getEventsForDay(day);

                            return (
                                <div key={day} className="calendar-day" style={{ backgroundColor: 'var(--bg-surface)', minHeight: '120px', padding: '0.5rem', position: 'relative' }}>
                                    <span style={{ fontWeight: '600', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{day}</span>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
                                        {dayEvents.map(event => (
                                            <div key={event.id} style={{
                                                fontSize: '0.75rem',
                                                padding: '4px',
                                                borderRadius: '4px',
                                                backgroundColor: 'var(--color-primary)',
                                                color: 'var(--text-inverse)',
                                                overflow: 'hidden',
                                                whiteSpace: 'nowrap',
                                                textOverflow: 'ellipsis',
                                                cursor: 'pointer'
                                            }} title={`${event.activity_type} - ${event.event_time}`}>
                                                {event.event_time.slice(0, 5)} {event.activity_type}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                </div>
            </div>

            {/* Calendar List (Mobile) */}
            <div className="mobile-only">
                <div className="mobile-calendar-list">
                    {Array.from({ length: days }).map((_, index) => {
                        const day = index + 1;
                        const dayEvents = getEventsForDay(day);
                        const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                        const dayName = date.toLocaleDateString('es-ES', { weekday: 'long' });
                        const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);

                        // Only show days with events or today? No, show all for context, or maybe just days with events + today?
                        // User wants to see events clearly. Let's show all days but highlight ones with events.
                        // Actually, scrolling 30 empty blocks is annoying. Let's filter?
                        // No, a calendar needs to show availability. Let's show all.

                        return (
                            <div key={day} className="mobile-day-row" style={{ opacity: dayEvents.length > 0 ? 1 : 0.7 }}>
                                <div className="mobile-day-header">
                                    <span className="mobile-day-number">{day}</span>
                                    <span style={{ fontSize: '1rem', fontWeight: '400' }}>{capitalizedDayName}</span>
                                </div>

                                <div className="mobile-day-events">
                                    {dayEvents.length > 0 ? (
                                        dayEvents.map(event => (
                                            <div key={event.id} className="mobile-event-item">
                                                <div style={{ fontWeight: 'bold', marginBottom: '0.25rem' }}>{event.activity_type}</div>
                                                <div style={{ fontSize: '0.9rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    <Clock size={16} />
                                                    {event.event_time.slice(0, 5)}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                                            Sin actividades programadas
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

        </div>
    );
}
