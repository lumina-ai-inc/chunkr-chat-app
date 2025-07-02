from chunkr_ai.models import (
    Configuration,
    ChunkProcessing,
    Tokenizer,
    OcrStrategy,
    SegmentProcessing,
    SegmentationStrategy,
    Pipeline,
    ErrorHandlingStrategy,
    LlmProcessing,
    FallbackStrategy,
    CroppingStrategy,
    GenerationConfig,
    GenerationStrategy,
)


def get_chunkr_config() -> Configuration:
    """
    Handles editing the default Chunkr configuration.

    The changes we make are:
    - Chunk processing with 1024 target length and CL100K_BASE tokenizer
    - High resolution processing enabled
    - Azure pipeline for OCR
    - Layout analysis segmentation strategy

    Returns:
        Configuration: A Chunkr Configuration object.
    """
    return Configuration(
        chunk_processing=ChunkProcessing(
            ignore_headers_and_footers=True,
            target_length=1024,
            tokenizer=Tokenizer.CL100K_BASE,
        ),
        expires_in=None,
        high_resolution=True,
        ocr_strategy=OcrStrategy.AUTO,
        segment_processing=SegmentProcessing(
            Title=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            SectionHeader=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            Text=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            ListItem=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            Table=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.LLM,
                llm="Summarize the key information in this table including any context from legends or surrounding text",
                markdown=GenerationStrategy.LLM,
                embed_sources=["LLM", "Markdown"],
                extended_context=True,
            ),
            Picture=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.LLM,
                llm=None,
                markdown=GenerationStrategy.LLM,
                embed_sources=["Markdown"],
                extended_context=True,
            ),
            Caption=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            Formula=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.LLM,
                llm=None,
                markdown=GenerationStrategy.LLM,
                embed_sources=["Markdown"],
                extended_context=True,
            ),
            Footnote=GenerationConfig(
                crop_image=CroppingStrategy.AUTO,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            PageHeader=GenerationConfig(
                crop_image=CroppingStrategy.AUTO,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            PageFooter=GenerationConfig(
                crop_image=CroppingStrategy.AUTO,
                html=GenerationStrategy.AUTO,
                llm=None,
                markdown=GenerationStrategy.AUTO,
                embed_sources=["Markdown"],
                extended_context=False,
            ),
            Page=GenerationConfig(
                crop_image=CroppingStrategy.ALL,
                html=GenerationStrategy.LLM,
                llm=None,
                markdown=GenerationStrategy.LLM,
                embed_sources=["Markdown"],
                extended_context=True,
            ),
        ),
        segmentation_strategy=SegmentationStrategy.LAYOUT_ANALYSIS,
        pipeline=Pipeline.AZURE,
        error_handling=ErrorHandlingStrategy.FAIL,
        llm_processing=LlmProcessing(
            model_id="gemini-pro-1.5",
            fallback_strategy=FallbackStrategy.default(),
        ),
    )
