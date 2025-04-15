import React, { useState, useEffect } from 'react'; // Import useEffect
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; // Import useAuth
import { Form, Input, Button, Card, Typography, Alert, Spin } from 'antd'; // Verify 'antd' is installed
import { UserOutlined, MailOutlined, LockOutlined } from '@ant-design/icons'; // Verify '@ant-design/icons' is installed

const { Title, Text } = Typography;

const Register = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register, isAuthenticated, error: authError, authLoading } = useAuth(); // Use context state/functions
  const [localError, setLocalError] = useState(''); // For form-specific errors like password mismatch
  const [success, setSuccess] = useState('');

  // Redirect if registration is successful and user becomes authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard'); // Redirect to dashboard after successful registration/login
    }
  }, [isAuthenticated, navigate]);

  // Clear errors when component mounts or authError changes from context
  useEffect(() => {
    setLocalError(''); // Clear local errors too
  }, [authError]);

  const onFinish = async (values) => {
    setLocalError('');
    setSuccess('');

    if (values.password !== values.confirmPassword) {
      setLocalError('Passwords do not match!');
      return;
    }

    // Call the register function from context
    const registrationSuccess = await register(values.name, values.email, values.password);

    if (registrationSuccess) {
      setSuccess('Registration successful! Redirecting...');
      // Navigation is handled by the useEffect watching isAuthenticated
    }
    // Error display is handled by the authError from context
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: 'linear-gradient(135deg, #1a365d 0%, #2c5282 100%)' }}>
      <Card style={{ width: 400, boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <Title level={3} style={{ color: '#1a365d', marginBottom: 5 }}>Register Account</Title>
          <Text type="secondary">Law Office Management System</Text>
        </div>

        {/* Display local form errors */}
        {localError && (
          <Alert message={localError} type="error" showIcon closable onClose={() => setLocalError('')} style={{ marginBottom: 24 }} />
        )}
        {/* Display errors from AuthContext */}
        {authError && !localError && ( // Show authError only if no localError
          <Alert message={authError} type="error" showIcon closable onClose={() => { /* Context should handle clearing error */ }} style={{ marginBottom: 24 }} />
        )}
        {success && (
          <Alert message={success} type="success" showIcon style={{ marginBottom: 24 }} />
        )}

        <Spin spinning={authLoading}> {/* Use authLoading from context */}
          <Form
            form={form}
            name="register"
            onFinish={onFinish}
            size="large"
          >
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Please input your Name!' }]}
            >
              <Input prefix={<UserOutlined />} placeholder="Full Name" />
            </Form.Item>

            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Please input your Email!' },
                { type: 'email', message: 'Please enter a valid email!' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="Email Address" />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please input your Password!' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Password" />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Please confirm your Password!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('The two passwords do not match!'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="Confirm Password" />
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" block loading={authLoading}> {/* Use authLoading */}
                Register
              </Button>
            </Form.Item>
          </Form>
        </Spin>

        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Text type="secondary">Already have an account? </Text>
          <Link to="/login">Log in here</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
