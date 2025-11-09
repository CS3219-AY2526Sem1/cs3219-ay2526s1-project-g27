import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

const mockSignUp = vi.fn();
const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    signup: mockSignUp,
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Register Page", () => {
  it("renders Register page UI when not authenticated", async () => {
    const { default: Register } = await import("./Register");
    render(<Register />);

    expect(screen.getByText("Register a new account")).toBeInTheDocument();
    expect(screen.getByText("Set your account details below")).toBeInTheDocument();
  });

  it("redirects to dashboard when authenticated", async () => {
      vi.mock("@/context/AuthContext", () => ({
        useAuth: () => ({
          isAuthenticated: true,
          signup: mockSignUp
        }),
      }));
  
      const { default: Register } = await import("./Register");
      render(<Register />);
  
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
      });
  });

});

describe("RegisterForm Component", () => {
  it("doesn't call signup with empty form", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("doesn't call signup without meeting username requirements", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(userNameInput[0], { target: { value: "u" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("doesn't call signup without meeting email requirements", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("doesn't call signup without meeting password requirements, less than 8 characters", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "my" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "my" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("doesn't call signup without meeting password requirements, more than 20 characters", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "123456789012345678901" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "123456789012345678901" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });


  it("doesn't call signup without meeting password requirements, no uppercase/lowercase letter/special character", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "123456789" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "123456789" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("doesn't call signup without meeting password requirements, no number", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "Mypassword" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "Mypassword" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("doesn't call signup as password and confirm password no match", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);
  
    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "Mypassword123" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledTimes(0);
    });
  });

  it("calls signup with correct values if valid", async () => {
    mockSignUp.mockResolvedValue({ success: true });
  
    const { default: RegisterForm } = await import("../../components/RegisterForm");
    render(<RegisterForm />);
  
    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getAllByLabelText(/confirm password/i);
    const userNameInput = screen.getAllByLabelText(/username/i);
  
    fireEvent.change(emailInput[0], { target: { value: "user@example.com" } });
    fireEvent.change(passwordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(confirmPasswordInput[0], { target: { value: "Mypassword123!" } });
    fireEvent.change(userNameInput[0], { target: { value: "user" } });
  
    const submitButton = screen.getAllByRole("button", { name: /sign up/i });
    fireEvent.click(submitButton[0]);
  
    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "Mypassword123!",
        name: "user",
      });
    });
  });
});
