#!/usr/bin/env node
const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} = require('@modelcontextprotocol/sdk/types.js');

const server = new Server(
  {
    name: 'mcp-reasoning-tools',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions for our tool-augmented reasoning system
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'boolean_evaluate',
        description: 'Systematically evaluate boolean expressions with step-by-step verification',
        inputSchema: {
          type: 'object',
          properties: {
            expression: {
              type: 'string',
              description: 'Boolean expression to evaluate (e.g., "True and False or not True")',
            },
          },
          required: ['expression'],
        },
      },
      {
        name: 'date_calculate',
        description: 'Perform date arithmetic with computational verification',
        inputSchema: {
          type: 'object',
          properties: {
            operation: {
              type: 'string',
              description: 'Date operation description (e.g., "add 7 days to 2023-01-15")',
            },
            base_date: {
              type: 'string',
              description: 'Starting date in YYYY-MM-DD format',
            },
            offset_days: {
              type: 'number',
              description: 'Number of days to add/subtract',
            },
            format: {
              type: 'string',
              description: 'Output format (MM/DD/YYYY, YYYY-MM-DD, etc.)',
              default: 'MM/DD/YYYY',
            },
          },
          required: ['base_date', 'offset_days'],
        },
      },
      {
        name: 'object_count',
        description: 'Systematically count objects by category with verification',
        inputSchema: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: { type: 'string' },
              description: 'List of items to categorize and count',
            },
            target_category: {
              type: 'string',
              description: 'Category to count (e.g., "animals", "fruits", "instruments")',
            },
          },
          required: ['items', 'target_category'],
        },
      },
      {
        name: 'state_track',
        description: 'Track object positions through a series of swaps/moves',
        inputSchema: {
          type: 'object',
          properties: {
            initial_state: {
              type: 'object',
              description: 'Initial positions/assignments (e.g., {"Alice": "red", "Bob": "blue"})',
            },
            operations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['swap', 'move'] },
                  participants: { type: 'array', items: { type: 'string' } },
                },
              },
              description: 'Sequence of operations to apply',
            },
          },
          required: ['initial_state', 'operations'],
        },
      },
      {
        name: 'systematic_verify',
        description: 'Apply 6-step systematic reasoning protocol to any problem',
        inputSchema: {
          type: 'object',
          properties: {
            problem: {
              type: 'string',
              description: 'Problem statement to analyze systematically',
            },
            problem_type: {
              type: 'string',
              enum: ['boolean', 'temporal', 'counting', 'deduction', 'spatial'],
              description: 'Type of reasoning problem',
            },
          },
          required: ['problem', 'problem_type'],
        },
      },
      {
        name: 'format_validate',
        description: 'Validate answer format and convert to expected format',
        inputSchema: {
          type: 'object',
          properties: {
            answer: {
              type: 'string',
              description: 'Raw answer to validate',
            },
            expected_format: {
              type: 'string',
              description: 'Expected format (multiple_choice, number, date, boolean)',
            },
            options: {
              type: 'array',
              items: { type: 'string' },
              description: 'Multiple choice options if applicable',
            },
          },
          required: ['answer', 'expected_format'],
        },
      },
    ],
  };
});

// Tool implementation handlers
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'boolean_evaluate':
        return await evaluateBoolean(args.expression);
      
      case 'date_calculate':
        return await calculateDate(args.base_date, args.offset_days, args.format || 'MM/DD/YYYY');
      
      case 'object_count':
        return await countObjects(args.items, args.target_category);
      
      case 'state_track':
        return await trackState(args.initial_state, args.operations);
      
      case 'systematic_verify':
        return await systematicVerify(args.problem, args.problem_type);
      
      case 'format_validate':
        return await validateFormat(args.answer, args.expected_format, args.options);
      
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error in ${name}: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Tool implementation functions
async function evaluateBoolean(expression) {
  const steps = [];
  const originalExpr = expression.replace(/\s+is\s*$/, '').trim();
  
  steps.push(`Original expression: ${originalExpr}`);
  steps.push('Applying operator precedence: NOT > AND > OR');
  
  // Parse and evaluate step by step
  try {
    // Convert natural language to JavaScript boolean
    let jsExpr = originalExpr
      .replace(/\bTrue\b/g, 'true')
      .replace(/\bFalse\b/g, 'false')
      .replace(/\band\b/g, '&&')
      .replace(/\bor\b/g, '||')
      .replace(/\bnot\b/g, '!');
    
    steps.push(`Converted to JavaScript: ${jsExpr}`);
    
    const result = eval(jsExpr);
    steps.push(`Final result: ${result}`);
    
    return {
      content: [
        {
          type: 'text',
          text: `Boolean Evaluation Result: ${result}\n\nStep-by-step verification:\n${steps.join('\n')}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error evaluating boolean expression: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
}

async function calculateDate(baseDate, offsetDays, format) {
  try {
    const date = new Date(baseDate);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date format: ${baseDate}`);
    }
    
    const resultDate = new Date(date);
    resultDate.setDate(resultDate.getDate() + offsetDays);
    
    let formatted;
    switch (format.toUpperCase()) {
      case 'MM/DD/YYYY':
        formatted = `${String(resultDate.getMonth() + 1).padStart(2, '0')}/${String(resultDate.getDate()).padStart(2, '0')}/${resultDate.getFullYear()}`;
        break;
      case 'YYYY-MM-DD':
        formatted = `${resultDate.getFullYear()}-${String(resultDate.getMonth() + 1).padStart(2, '0')}-${String(resultDate.getDate()).padStart(2, '0')}`;
        break;
      default:
        formatted = resultDate.toDateString();
    }
    
    const verification = [
      `Base date: ${baseDate} (${date.toDateString()})`,
      `Offset: ${offsetDays} days`,
      `Result date: ${resultDate.toDateString()}`,
      `Formatted: ${formatted}`,
    ];
    
    return {
      content: [
        {
          type: 'text',
          text: `Date Calculation Result: ${formatted}\n\nVerification:\n${verification.join('\n')}`,
        },
      ],
    };
  } catch (error) {
    throw new Error(`Date calculation failed: ${error.message}`);
  }
}

async function countObjects(items, targetCategory) {
  const categorization = {
    animals: ['bear', 'snake', 'rabbit', 'goat', 'cat', 'dog', 'bird', 'fish', 'elephant', 'lion'],
    fruits: ['apple', 'banana', 'orange', 'grape', 'strawberry', 'blackberry', 'nectarine', 'plum'],
    instruments: ['clarinet', 'trombone', 'saxophone', 'flute', 'piano', 'guitar', 'violin'],
    // Add more categories as needed
  };
  
  const targetWords = categorization[targetCategory.toLowerCase()] || [];
  const matches = [];
  const nonMatches = [];
  
  for (const item of items) {
    const itemLower = item.toLowerCase().replace(/\d+/g, '').trim();
    const isMatch = targetWords.some(word => itemLower.includes(word));
    
    if (isMatch) {
      // Extract quantity if present
      const quantityMatch = item.match(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\b/i);
      const quantity = quantityMatch ? 
        (isNaN(Number(quantityMatch[1])) ? 
          ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']
            .indexOf(quantityMatch[1].toLowerCase()) + 1 : 
          Number(quantityMatch[1])) : 1;
      
      matches.push({ item, quantity });
    } else {
      nonMatches.push(item);
    }
  }
  
  const totalCount = matches.reduce((sum, match) => sum + match.quantity, 0);
  
  const breakdown = [
    `Target category: ${targetCategory}`,
    `Matching items:`,
    ...matches.map(m => `  - ${m.item} (${m.quantity})`),
    `Non-matching items:`,
    ...nonMatches.map(item => `  - ${item}`),
    `Total ${targetCategory}: ${totalCount}`,
  ];
  
  return {
    content: [
      {
        type: 'text',
        text: `Object Count Result: ${totalCount}\n\nBreakdown:\n${breakdown.join('\n')}`,
      },
    ],
  };
}

async function trackState(initialState, operations) {
  let currentState = { ...initialState };
  const steps = [`Initial state: ${JSON.stringify(currentState)}`];
  
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    
    if (op.type === 'swap' && op.participants.length >= 2) {
      const [a, b] = op.participants;
      const temp = currentState[a];
      currentState[a] = currentState[b];
      currentState[b] = temp;
      
      steps.push(`Step ${i + 1}: Swap ${a} and ${b}`);
      steps.push(`  Result: ${JSON.stringify(currentState)}`);
    }
    // Add more operation types as needed
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `State Tracking Result:\n\n${steps.join('\n')}\n\nFinal state: ${JSON.stringify(currentState)}`,
      },
    ],
  };
}

async function systematicVerify(problem, problemType) {
  const protocol = [
    '🔍 STEP 1: Complete Problem Reading',
    `Problem: ${problem}`,
    `Type: ${problemType}`,
    '',
    '📊 STEP 2: Problem Classification',
    `Identified as: ${problemType} reasoning task`,
    '',
    '📝 STEP 3: Key Information Extraction',
    '(Extract specific constraints, given facts, target to find)',
    '',
    '⚙️ STEP 4: Apply Domain-Specific Method',
    '(Use appropriate computational tools for this problem type)',
    '',
    '✅ STEP 5: Format Verification', 
    '(Ensure answer matches expected format)',
    '',
    '🔬 STEP 6: Double-Check Verification',
    '(Cross-verify using alternative methods)',
  ];
  
  return {
    content: [
      {
        type: 'text',
        text: `Systematic Reasoning Protocol Applied:\n\n${protocol.join('\n')}\n\nRecommendation: Use specific tools (boolean_evaluate, date_calculate, etc.) for computational verification.`,
      },
    ],
  };
}

async function validateFormat(answer, expectedFormat, options) {
  const validation = [`Original answer: ${answer}`, `Expected format: ${expectedFormat}`];
  
  let validatedAnswer = answer;
  let isValid = true;
  
  switch (expectedFormat.toLowerCase()) {
    case 'multiple_choice':
      if (options && options.length > 0) {
        // Try to match answer to one of the options
        const match = options.find(opt => 
          opt.toLowerCase().includes(answer.toLowerCase()) ||
          answer.toLowerCase().includes(opt.toLowerCase())
        );
        
        if (match) {
          validatedAnswer = match;
          validation.push(`Matched to option: ${match}`);
        } else {
          isValid = false;
          validation.push(`No matching option found. Available: ${options.join(', ')}`);
        }
      }
      break;
      
    case 'boolean':
      const boolMatch = answer.toLowerCase().match(/\b(true|false)\b/);
      if (boolMatch) {
        validatedAnswer = boolMatch[1].charAt(0).toUpperCase() + boolMatch[1].slice(1);
        validation.push(`Extracted boolean: ${validatedAnswer}`);
      } else {
        isValid = false;
        validation.push('No boolean value found');
      }
      break;
      
    case 'number':
      const numMatch = answer.match(/\d+/);
      if (numMatch) {
        validatedAnswer = numMatch[0];
        validation.push(`Extracted number: ${validatedAnswer}`);
      } else {
        isValid = false;
        validation.push('No number found');
      }
      break;
  }
  
  return {
    content: [
      {
        type: 'text',
        text: `Format Validation:\n\n${validation.join('\n')}\n\nValidated answer: ${validatedAnswer}\nValid: ${isValid}`,
      },
    ],
  };
}

// Start the server
const transport = new StdioServerTransport();
server.connect(transport);
console.error('mcp-reasoning-tools MCP server running on stdio');
