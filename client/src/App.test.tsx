import React from "react";
import { render, screen } from "@testing-library/react";
import PaissaApp from "./PaissaApp";

test("renders learn react link", () => {
    render(<PaissaApp />);
    const linkElement = screen.getByText(/learn react/i);
    expect(linkElement).toBeInTheDocument();
});
