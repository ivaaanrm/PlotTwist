from langchain_core.language_models import BaseChatModel

from app.recommendations.config import llm_settings


def get_llm() -> BaseChatModel:
    if llm_settings.LLM_PROVIDER == "openai":
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(
            model=llm_settings.OPENAI_MODEL,
            api_key=llm_settings.OPENAI_API_KEY,  # type: ignore[arg-type]
            temperature=0.7,
        )
    from langchain_ollama import ChatOllama

    return ChatOllama(
        model=llm_settings.OLLAMA_MODEL,
        base_url=llm_settings.OLLAMA_BASE_URL,
        temperature=0.7,
    )
