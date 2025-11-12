import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import "@testing-library/jest-dom/vitest";

const mockNavigate = vi.fn();
const mockLogin = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});


vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    isAuthenticated: false,
    login: mockLogin
  }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockNavigate.mockClear();
  mockLogin.mockClear();
});

describe("Login Page", () => {
  it("renders login page UI when not authenticated", async () => {
    const { default: Login } = await import("./Login");
    render(<Login />);

    expect(screen.getByText("Login to your account")).toBeInTheDocument();
    expect(screen.getByText("Enter your email and password below")).toBeInTheDocument();
  });

  it("redirects to dashboard when authenticated", async () => {
    vi.mock("@/context/AuthContext", () => ({
      useAuth: () => ({
        isAuthenticated: true,
        login: mockLogin
      }),
    }));

    const { default: Login } = await import("./Login");
    render(<Login />);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/", { replace: true });
    });
  });
});

describe("LoginForm Component", () => {
  it("doesn't redirect to dashboard for empty form submission", async () => {
    const { default: LoginForm } = await import("../../components/LoginForm");
    render(<LoginForm />);

    const submitButton = screen.getAllByRole("button", { name: /login/i });
    fireEvent.click(submitButton[0]);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledTimes(0);
    });
  });

  it("doesn't redirect to dashboard for invalid email/password", async () => {
    const { default: LoginForm } = await import("../../components/LoginForm");
    render(<LoginForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/password/i);

    fireEvent.change(emailInput[0], {
      target: { value: "invalid-email" },
    });
    fireEvent.change(passwordInput[0], {
      target: { value: "123" },
    });

    const submitButton = screen.getAllByRole("button", { name: /login/i });
    fireEvent.click(submitButton[0]);

    await waitFor(() => {
      expect(mockNavigate).toBeCalledTimes(0);
    });
  });

  it("calls login with correct values if valid", async () => {
    mockLogin.mockResolvedValue({ success: true });

    const { default: LoginForm } = await import("../../components/LoginForm");
    render(<LoginForm />);

    const emailInput = screen.getAllByLabelText(/email/i);
    const passwordInput = screen.getAllByLabelText(/password/i);

    fireEvent.change(emailInput[0], {
      target: { value: "user@example.com" },
    });
    fireEvent.change(passwordInput[0], {
      target: { value: "mypassword" },
    });

    const submitButton = screen.getAllByRole("button", { name: /login/i });
    fireEvent.click(submitButton[0]);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "mypassword"
      });
    });
  });
});