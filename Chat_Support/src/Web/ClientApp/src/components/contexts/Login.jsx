import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Form, Button, Alert } from "react-bootstrap";
import "../../App.css";

const Login = () => {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    // اعتبارسنجی ساده شماره
    if (!/^09\d{9}$/.test(phone)) {
      setError("شماره موبایل معتبر وارد کنید");
      return;
    }
    // اینجا باید درخواست به بک‌اند ارسال شود
    // فرض: اگر موفق بود، به صفحه چت برو
    // await api.loginWithPhone(phone)
    navigate("/chat");
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: "100vh" }}>
      <Form onSubmit={handleSubmit} className="login-form p-4 shadow rounded" style={{ minWidth: 320 }}>
        <h4 className="mb-4 text-center">ورود با شماره موبایل</h4>
        <Form.Group className="mb-3">
          <Form.Label>شماره موبایل</Form.Label>
          <Form.Control
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="مثال: 09123456789"
            maxLength={11}
            required
          />
        </Form.Group>
        {error && <Alert variant="danger">{error}</Alert>}
        <Button type="submit" variant="primary" className="w-100">ورود</Button>
      </Form>
    </Container>
  );
};

export default Login;
