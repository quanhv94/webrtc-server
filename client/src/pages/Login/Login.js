import React from 'react';
import { Card, CardTitle, Container, Row, Col } from 'reactstrap';
import './style.scss';

const Login = () => (
  <div className="login-page">
    <Container>
      <Row>
        <Col sm={9} md={7} lg={5} className="mx-auto">
          <Card body>
            <CardTitle className="text-center">
              <h5 className="text-center">Chào mừng bạn đến với E-School</h5>
            </CardTitle>
          </Card>
        </Col>
      </Row>
    </Container>
  </div>
);

export default Login;
