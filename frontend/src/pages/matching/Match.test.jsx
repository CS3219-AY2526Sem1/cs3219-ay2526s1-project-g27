import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { AuthProvider } from "../../context/AuthContext"
import { MatchingProvider } from "../../context/MatchContext"
import "@testing-library/jest-dom/vitest";
import Match from "./Match";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return { ...actual, useNavigate: () => mockNavigate };
});

beforeAll(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

describe("Match Page", () => {
  it("unable to join queue, no difficulty selected", async () => {
    render(
        <AuthProvider>
            <MatchingProvider>
                <Match />
            </MatchingProvider>
        </AuthProvider>
    );

    const comboBoxes = screen.getAllByRole("combobox");
    const topicSelect = comboBoxes[1];
    fireEvent.click(topicSelect);

    const topicOption = await screen.findByText("Arrays");
    fireEvent.click(topicOption);

    const startButton = screen.getAllByRole("button", { name: /start matching!/i });
    fireEvent.click(startButton[0]);

    await waitFor(() => {
      expect(screen.getByText(/please select topic and difficulty/i)).toBeInTheDocument();
    });
  });

  it("unable to join queue, no topic selected", async () => {
    render(
        <AuthProvider>
            <MatchingProvider>
                <Match />
            </MatchingProvider>
        </AuthProvider>
    );

    const comboBoxes = screen.getAllByRole("combobox");
    const difficultySelect = comboBoxes[0]; 
    fireEvent.click(difficultySelect);

    const difficultyOption = await screen.findByText("easy");
    fireEvent.click(difficultyOption);

    const startButton = screen.getAllByRole("button", { name: /start matching!/i });
    fireEvent.click(startButton[0]);

    await waitFor(() => {
      expect(screen.getByText(/please select topic and difficulty/i)).toBeInTheDocument();
    });
  });
});
