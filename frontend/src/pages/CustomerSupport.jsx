import { useEffect, useRef, useState } from 'react';

const WS_URL = 'ws://localhost:4000'; // Change to your WebSocket server

const CustomerSupport = () => {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [connected, setConnected] = useState(false);
    const wsRef = useRef(null);

    useEffect(() => {
        const ws = new WebSocket(WS_URL);
        wsRef.current = ws;

        ws.onopen = () => {
            setConnected(true);
            // Notify connection via global event (optional listener)
            typeof window !== 'undefined' && window?.dispatchEvent?.(new CustomEvent('toast', { detail: { type: 'success', message: 'Connected to support.' } }));
        };

        ws.onclose = () => {
            setConnected(false);
            typeof window !== 'undefined' && window?.dispatchEvent?.(new CustomEvent('toast', { detail: { type: 'warn', message: 'Disconnected from support.' } }));
        };

        ws.onerror = (error) => {
            setConnected(false);
            console.error('WebSocket error:', error);
        };

        ws.onmessage = (event) => {
            setMessages((prev) => [...prev, { sender: 'support', text: event.data, id: Date.now() }]);
        };

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    const sendMessage = () => {
        if (input.trim() && wsRef.current && connected) {
            wsRef.current.send(input);
            setMessages((prev) => [...prev, { sender: 'user', text: input, id: Date.now() }]);
            setInput('');
        }
    };

    return (
        <div
            className="customer-support-bg"
            style={{
                minHeight: '100vh',
                padding: '80px 0',
                background: 'linear-gradient(135deg, var(--bg-dark, #1a1f3a), var(--bg-card, #2a2f5a))'
            }}
        >
            <div className="container" style={{ maxWidth: 540, margin: '0 auto' }}>
                <div
                    className="card"
                    style={{
                        minHeight: 480,
                        padding: '40px 32px',
                        borderRadius: 'var(--border-radius, 12px)',
                        boxShadow: 'var(--shadow-heavy, 0 4px 12px rgba(0,0,0,0.15))',
                        border: '1px solid var(--border-color, #3a3f5a)',
                        background: 'var(--bg-card, #2a2f5a)',
                        display: 'flex',
                        flexDirection: 'column'
                    }}
                >
                    <h2
                        style={{
                            fontFamily: 'Playfair Display, serif',
                            marginBottom: 18,
                            fontSize: '32px',
                            color: 'var(--primary-color, #ff6b35)',
                            textAlign: 'center'
                        }}
                    >
                        Customer Support Chat
                    </h2>
                    <div
                        style={{
                            marginBottom: 18,
                            textAlign: 'center',
                            fontWeight: 600,
                            color: connected ? 'var(--success-color, #28a745)' : 'var(--error-color, #dc3545)',
                            fontSize: '16px'
                        }}
                    >
                        {connected ? '🟢 Connected to support' : '🔴 Connecting...'}
                    </div>
                    <div
                        style={{
                            flex: 1,
                            border: '1px solid var(--border-color, #3a3f5a)',
                            borderRadius: 12,
                            padding: 16,
                            minHeight: 220,
                            maxHeight: 320,
                            overflowY: 'auto',
                            marginBottom: 18,
                            background: 'rgba(26,31,58,0.98)',
                            boxShadow: 'var(--shadow-light, 0 2px 8px rgba(0,0,0,0.1))'
                        }}
                        role="log"
                        aria-live="polite"
                    >
                        {messages.length === 0 ? (
                            <div style={{ color: 'var(--text-gray, #a0a5c0)', textAlign: 'center', marginTop: 40 }}>
                                No messages yet. Start chatting!
                            </div>
                        ) : (
                            messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    style={{
                                        display: 'flex',
                                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                                        marginBottom: 10
                                    }}
                                >
                                    <span
                                        style={{
                                            background:
                                                msg.sender === 'user'
                                                    ? 'linear-gradient(135deg, var(--primary-color, #ff6b35), var(--primary-dark, #e55a28))'
                                                    : 'rgba(255,255,255,0.08)',
                                            color: msg.sender === 'user' ? 'white' : 'var(--text-light, #d0d5f0)',
                                            borderRadius: 12,
                                            padding: '10px 18px',
                                            fontSize: 16,
                                            maxWidth: '80%',
                                            boxShadow:
                                                msg.sender === 'user'
                                                    ? '0 2px 8px rgba(255,107,53,0.12)'
                                                    : '0 2px 8px rgba(0,0,0,0.08)',
                                            fontWeight: msg.sender === 'user' ? 600 : 500,
                                            letterSpacing: '0.2px'
                                        }}
                                    >
                                        {msg.text}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') sendMessage();
                            }}
                            className="form-input"
                            placeholder="Type your message..."
                            disabled={!connected}
                            style={{
                                flex: 1,
                                fontSize: 16,
                                borderRadius: 'var(--border-radius, 8px)',
                                border: '2px solid var(--border-color, #3a3f5a)',
                                background: 'var(--bg-card, #2a2f5a)',
                                color: 'var(--text-light, #d0d5f0)',
                                padding: '10px'
                            }}
                            aria-label="Message input"
                        />
                        <button
                            className="btn btn-primary"
                            onClick={sendMessage}
                            disabled={!connected || !input.trim()}
                            style={{
                                minWidth: 100,
                                fontWeight: 700,
                                fontSize: 16,
                                borderRadius: 20,
                                background: 'var(--primary-color, #ff6b35)',
                                color: 'white'
                            }}
                            aria-label="Send message"
                        >
                            Send
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CustomerSupport;