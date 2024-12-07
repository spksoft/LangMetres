# LangMetres 🤖

LangMetres is a powerful web application for evaluating and comparing different language models. It provides a unified interface for testing multiple models simultaneously while tracking costs, tokens, and performance metrics. Thank to  [LiteLLM](https://github.com/BerriAI/litellm), it supports a wide range of LLM providers.

<img width="605" alt="LangMetres Screenshot" src="https://github.com/user-attachments/assets/cf5cbb62-6768-42f6-914b-30f5fb59e07b">

## Features ✨

- **Multi-Model Testing**: Test multiple language models side by side
- **Real-time Metrics**: Track token usage, costs, and latency for each response
- **Model Configuration**: Adjust temperature and top_p settings per model
- **Response Comparison**: View responses in both markdown and raw formats
- **Pass/Fail Tracking**: Mark successful responses and track evaluation results
- **Import/Export**: Save and load test results in Excel format
- **Environment Management**: Easy configuration of API keys and settings
- **Local Storage**: Automatically saves test cases and configurations

## Quick Start 🚀

### Using Docker

The easiest way to run LangMetres is using Docker:

```bash
docker run -p 1905:1905 spksoft/langmetres:latest
```

Then visit `http://localhost:1905` in your browser.

## Environment Variables 🔑

Configure your API keys in the Environment Variables tab. LangMetres supports various LLM providers through LiteLLM. See the [LiteLLM documentation](https://docs.litellm.ai/docs/providers/) for provider-specific configurations.

Example configuration:
```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
```

## Usage Guide 📖

1. **Set Environment Variables**
   - Add your API keys in the Environment Variables tab
   - Save to localStorage if desired

2. **Select Models**
   - Choose models from the dropdown
   - Configure temperature and top_p for each model

3. **Create Test Cases**
   - Enter your test prompts
   - Run tests against all selected models
   - View and compare responses
   - Mark successful responses with PASS button

4. **Export/Import Results**
   - Export test results to Excel
   - Import previous test results
   - Results include all metrics and PASS/FAIL status

## Contributing 🤝

Contributions are welcome! Please feel free to submit a Pull Request. For major changes, please open an issue first to discuss what you would like to change.

### Development Setup

1. Clone the repository:

```bash
git clone https://github.com/spksoft/langmetres.git
cd langmetres
```

2. Install dependencies:

```bash
# Frontend
cd frontend
npm install

# Backend
cd ../backend
poetry install
```

3. Run the development servers:

```bash
# Frontend
npm run dev

# Backend
poetry run start
```

## Support 💬

If you have any questions or run into issues, please open an issue in the GitHub repository.

## Author ✍️

Made with ❤️ and 🤖 by [@spksoft](https://github.com/spksoft)

## Version 🏷️

Current Version: 0.1.0-alpha.3

## License 📄

MIT