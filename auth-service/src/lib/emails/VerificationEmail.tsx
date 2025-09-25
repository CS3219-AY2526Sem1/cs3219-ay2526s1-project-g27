import * as React from 'react';
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Tailwind,
} from '@react-email/components';

interface VerificationEmailProps {
  userName: string;
  verificationUrl: string;
}

const VerificationEmail: React.FC<VerificationEmailProps> = ({
  userName,
  verificationUrl,
}) => {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Please verify your email address to complete your registration</Preview>
      <Tailwind>
        <Body className="bg-gray-100 font-sans py-[40px]">
          <Container className="bg-white rounded-[8px] p-[32px] max-w-[600px] mx-auto">
            <Section>
              <Heading className="text-[24px] font-bold text-gray-900 mb-[24px] text-center">
                Verify Your Email Address
              </Heading>
              
              {/* 3. Personalize the greeting with the user's name */}
              <Text className="text-[16px] text-gray-700 mb-[16px]">
                Hi {userName},
              </Text>
              
              <Text className="text-[16px] text-gray-700 mb-[24px]">
                Thank you for signing up! To complete your registration and secure your account, 
                please verify your email address by clicking the button below.
              </Text>
              
              <Section className="text-center mb-[32px]">
                <Button
                  href={verificationUrl}
                  className="bg-blue-600 text-white px-[32px] py-[12px] rounded-[6px] text-[16px] font-medium box-border"
                >
                  Verify Email Address
                </Button>
              </Section>
              
              <Text className="text-[14px] text-gray-600 mb-[16px]">
                If you didn't create an account with us, you can safely ignore this email.
              </Text>
              
              <Text className="text-[14px] text-gray-600 mb-[32px]">
                This verification link will expire in 24 hours for security purposes.
              </Text>
            </Section>
            
            <Section className="border-t border-solid border-gray-200 pt-[24px]">
              {/* 4. Replace placeholder information with your actual details */}
              <Text className="text-[12px] text-gray-500 text-center m-0">
                © 2025 Acme Inc. All rights reserved.
              </Text>
              <Text className="text-[12px] text-gray-500 text-center m-0">
                123 Innovation Drive, Singapore 123456
              </Text>
            </Section>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export const PreviewProps = {
  userName: "Alan Turing",
  verificationUrl: "https://example.com/verify?token=abc123",
};

export default VerificationEmail;