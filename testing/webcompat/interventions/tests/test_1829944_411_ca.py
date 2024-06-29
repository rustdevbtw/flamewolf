import pytest

URL = "https://411.ca"
UNSUPPORTED_CSS = "ngb-alert.header-outdated-alert"


@pytest.mark.asyncio
@pytest.mark.with_interventions
async def test_enabled(client):
    await client.navigate(URL)
    assert not client.find_css(UNSUPPORTED_CSS)


@pytest.mark.asyncio
@pytest.mark.without_interventions
async def test_disabled(client):
    await client.navigate(URL)
    assert client.find_css(UNSUPPORTED_CSS)
