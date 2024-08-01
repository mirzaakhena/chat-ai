import { ToolCall } from "./functions.js";
import { parseToolCalls } from "./tool_call_parser.js";

describe("parseToolCalls", () => {
  //

  it("should correctly transform a simple ToolCall array", () => {
    const input: ToolCall[] = [{ index: 0, id: "call_1", type: "function", function: { name: "testFunc", arguments: '{"arg":"value"}' } }];
    const expected: ToolCall[] = [{ index: 0, id: "call_1", type: "function", function: { name: "testFunc", arguments: '{"arg":"value"}' } }];
    expect(parseToolCalls(input)).toEqual(expected);
  });

  it("should combine split arguments", () => {
    const input: ToolCall[] = [
      { index: 0, id: "call_1", type: "function", function: { name: "writeFile", arguments: "" } },
      { function: { arguments: '{"fi' } },
      { function: { arguments: 'lename":"test.txt"}' } },
    ];
    const expected: ToolCall[] = [{ index: 0, id: "call_1", type: "function", function: { name: "writeFile", arguments: '{"filename":"test.txt"}' } }];
    expect(parseToolCalls(input)).toEqual(expected);
  });

  it("should handle multiple ToolCalls", () => {
    const input: ToolCall[] = [
      { index: 0, id: "call_1", type: "function", function: { name: "func1", arguments: '{"a":1}' } },
      { index: 1, id: "call_2", type: "function", function: { name: "func2", arguments: '{"b":2}' } },
    ];
    const expected: ToolCall[] = [
      { index: 0, id: "call_1", type: "function", function: { name: "func1", arguments: '{"a":1}' } },
      { index: 1, id: "call_2", type: "function", function: { name: "func2", arguments: '{"b":2}' } },
    ];
    expect(parseToolCalls(input)).toEqual(expected);
  });

  it("should handle empty input", () => {
    expect(parseToolCalls([])).toEqual([]);
  });

  it("should handle incomplete ToolCalls", () => {
    const input: ToolCall[] = [{ index: 0, id: "call_1", type: "function" }, { function: { name: "testFunc" } }, { function: { arguments: '{"test":true}' } }];
    const expected: ToolCall[] = [{ index: 0, id: "call_1", type: "function", function: { name: "", arguments: '{"test":true}' } }];
    expect(parseToolCalls(input)).toEqual(expected);
  });

  it("should handle this sample case", () => {
    const input: ToolCall[] = [
      { index: 0, id: "call_ppQdA4G8GmLuNXrvbK9nUKd1", type: "function", function: { name: "writeFile", arguments: "" } },
      { index: 0, function: { arguments: '{"fi' } },
      { index: 0, function: { arguments: "lenam" } },
      { index: 0, function: { arguments: 'e": "a' } },
      { index: 0, function: { arguments: "bc.t" } },
      { index: 0, function: { arguments: 'xt", ' } },
      { index: 0, function: { arguments: '"conte' } },
      { index: 0, function: { arguments: 'nt":' } },
      { index: 0, function: { arguments: ' "hel' } },
      { index: 0, function: { arguments: "loworl" } },
      { index: 0, function: { arguments: 'd"}' } },
      { index: 1, id: "call_67WjwLDkIPcssMzdjJhPoZec", type: "function", function: { name: "readFile", arguments: "" } },
      { index: 1, function: { arguments: '{"fi' } },
      { index: 1, function: { arguments: "lenam" } },
      { index: 1, function: { arguments: 'e": "x' } },
      { index: 1, function: { arguments: "yz.t" } },
      { index: 1, function: { arguments: 'xt"}' } },
    ];

    const expected: ToolCall[] = [
      {
        index: 0,
        id: "call_ppQdA4G8GmLuNXrvbK9nUKd1",
        type: "function",
        function: {
          name: "writeFile",
          arguments: '{"filename": "abc.txt", "content": "helloworld"}',
        },
      },
      {
        index: 1,
        id: "call_67WjwLDkIPcssMzdjJhPoZec",
        type: "function",
        function: {
          name: "readFile",
          arguments: '{"filename": "xyz.txt"}',
        },
      },
    ];

    expect(parseToolCalls(input)).toEqual(expected);
  });
});
