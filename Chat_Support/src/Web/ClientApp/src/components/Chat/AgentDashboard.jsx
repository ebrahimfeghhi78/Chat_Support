import React, {useState, useEffect} from 'react';
import {Container, Row, Col, Card, Button, Form, Badge, ListGroup, Spinner, Alert, ButtonGroup} from 'react-bootstrap';
import {MessageSquare, Clock, CheckCircle, ArrowRight, RefreshCw, Mail, Circle} from 'lucide-react';
import { chatApi } from '../../services/chatApi';
import './Chat.css';

const AgentDashboard = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [agentStatus, setAgentStatus] = useState('Available');
  const [stats, setStats] = useState({
    activeChats: 0,
    resolvedToday: 0,
    avgResponseTime: '2m 15s',
  });
  const [isLoading, setIsLoading] = useState(true);

  const loadTickets = async () => {
    try {
      const tickets = await chatApi.getSupportTickets();
      setTickets(tickets);
      setStats((prev) => ({...prev, activeChats: tickets.filter((t) => t.status < 2).length}));
    } catch (error) {
      console.error('Failed to load tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTickets();
    const interval = setInterval(loadTickets, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinChat = (ticket) => {
    const chatUrl = `/chat/${ticket.chatRoomId}?support=true&ticketId=${ticket.id}`;
    window.open(chatUrl, '_blank');
  };

  const getStatusVariant = (status) => ({0: 'primary', 1: 'warning', 2: 'success', 3: 'secondary'}[status] || 'secondary');
  const getStatusText = (status) => ({0: 'باز', 1: 'در حال بررسی', 2: 'حل شده', 3: 'بسته شده'}[status] || 'نامشخص');
  const getAgentStatusColor = (status) => ({Available: 'success', Busy: 'warning', Away: 'danger', Offline: 'secondary'}[status] || 'secondary');

  const renderSidebar = () => (
    <div className="dashboard-sidebar p-3">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">داشبورد پشتیبان</h5>
        <Button variant="light" size="sm" onClick={loadTickets}>
          <RefreshCw size={16} />
        </Button>
      </div>
      <div className="d-flex align-items-center gap-2 mb-3">
        <Circle size={12} fill="currentColor" className={`text-${getAgentStatusColor(agentStatus)}`} />
        <Form.Select value={agentStatus} onChange={(e) => setAgentStatus(e.target.value)} size="sm">
          <option value="Available">در دسترس</option>
          <option value="Busy">مشغول</option>
          <option value="Away">غایب</option>
          <option value="Offline">آفلاین</option>
        </Form.Select>
      </div>
      <Row className="g-2 mb-3">
        <Col xs={6}>
          <Card bg="primary" text="white" className="text-center p-2">
            <h6 className="mb-0">{stats.activeChats}</h6>
            <small>گفتگوهای فعال</small>
          </Card>
        </Col>
        <Col xs={6}>
          <Card bg="success" text="white" className="text-center p-2">
            <h6 className="mb-0">{stats.resolvedToday}</h6>
            <small>حل شده امروز</small>
          </Card>
        </Col>
      </Row>
      <h6 className="text-muted mb-3">تیکت‌های پشتیبانی</h6>
      <div className="ticket-list">
        {isLoading ? (
          <div className="text-center py-5">
            <Spinner />
          </div>
        ) : tickets.length === 0 ? (
          <Alert variant="info">تیکتی یافت نشد.</Alert>
        ) : (
          <ListGroup variant="flush">
            {tickets.map((ticket) => (
              <ListGroup.Item key={ticket.id} action active={selectedTicket?.id === ticket.id} onClick={() => setSelectedTicket(ticket)} className="mb-2 border rounded">
                <div className="d-flex justify-content-between">
                  <strong>{ticket.requesterName}</strong>
                  <Badge bg={getStatusVariant(ticket.status)}>{getStatusText(ticket.status)}</Badge>
                </div>
                <p className="text-muted small mb-1 text-truncate">{ticket.lastMessage?.content}</p>
                <small className="text-muted">{new Date(ticket.created).toLocaleTimeString()}</small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </div>
    </div>
  );

  const renderMainContent = () => (
    <div className="dashboard-main p-4">
      {selectedTicket ? (
        <>
          <Card className="mb-4">
            <Card.Header as="h5">جزئیات تیکت #{selectedTicket.id}</Card.Header>
            <Card.Body>
              <h4>{selectedTicket.requesterName}</h4>
              <div className="d-flex gap-3 text-muted small mb-3">
                {selectedTicket.requesterEmail && (
                  <span>
                    <Mail size={16} className="me-1" />
                    {selectedTicket.requesterEmail}
                  </span>
                )}
                <span>
                  <Clock size={16} className="me-1" />
                  {new Date(selectedTicket.created).toLocaleString()}
                </span>
              </div>
              <Row>
                <Col sm={6}>
                  <dt className="text-muted">وضعیت</dt>
                  <dd>
                    <Badge bg={getStatusVariant(selectedTicket.status)}>{getStatusText(selectedTicket.status)}</Badge>
                  </dd>
                </Col>
                <Col sm={6}>
                  <dt className="text-muted">شناسه چت</dt>
                  <dd>#{selectedTicket.chatRoomId}</dd>
                </Col>
              </Row>
              <ButtonGroup className="mt-3">
                <Button variant="primary" onClick={() => handleJoinChat(selectedTicket)}>
                  <MessageSquare size={16} className="me-1" /> ورود به چت
                </Button>
                <Button variant="outline-secondary">
                  <ArrowRight size={16} className="me-1" /> انتقال
                </Button>
                <Button variant="outline-success">
                  <CheckCircle size={16} className="me-1" /> بستن تیکت
                </Button>
              </ButtonGroup>
            </Card.Body>
          </Card>
        </>
      ) : (
        <div className="d-flex align-items-center justify-content-center h-100 text-center text-muted">
          <div>
            <MessageSquare size={64} className="mb-3" />
            <h4>تیکتی انتخاب نشده است</h4>
            <p>برای مشاهده جزئیات، یک تیکت را از لیست انتخاب کنید.</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Container fluid className="agent-dashboard">
      <Row className="g-0 h-100">
        <Col md={4} lg={3}>
          {renderSidebar()}
        </Col>
        <Col md={8} lg={9}>
          {renderMainContent()}
        </Col>
      </Row>
    </Container>
  );
};

export default AgentDashboard;
