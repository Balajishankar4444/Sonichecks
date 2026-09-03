from enum import Enum
from typing import Dict
from pydantic import BaseModel

class ProductTier(str, Enum):
    FREE = "FREE"
    PRO = "PRO"
    STUDIO = "STUDIO"

class TierFeatures(BaseModel):
    name: str
    price_eur: float
    monthly_file_limit: int
    max_batch_size: int
    allow_batch_processing: bool
    allow_batch_matrix: bool
    allow_pdf_export: bool
    allow_csv_export: bool
    allow_sha256_certificate: bool
    allow_history: bool
    allow_custom_profiles: bool
    allow_projects: bool
    priority_processing: bool

TIER_DEFINITIONS: Dict[ProductTier, TierFeatures] = {
    ProductTier.FREE: TierFeatures(
        name="Free",
        price_eur=0.0,
        monthly_file_limit=5,
        max_batch_size=1,
        allow_batch_processing=False,
        allow_batch_matrix=False,
        allow_pdf_export=False,
        allow_csv_export=False,
        allow_sha256_certificate=False,
        allow_history=False,
        allow_custom_profiles=False,
        allow_projects=False,
        priority_processing=False
    ),
    ProductTier.PRO: TierFeatures(
        name="Pro",
        price_eur=4.99,
        monthly_file_limit=100,
        max_batch_size=50,
        allow_batch_processing=True,
        allow_batch_matrix=True,
        allow_pdf_export=True,
        allow_csv_export=True,
        allow_sha256_certificate=True,
        allow_history=True,
        allow_custom_profiles=True,
        allow_projects=False,
        priority_processing=False
    ),
    ProductTier.STUDIO: TierFeatures(
        name="Studio",
        price_eur=14.99,
        monthly_file_limit=500,
        max_batch_size=200,
        allow_batch_processing=True,
        allow_batch_matrix=True,
        allow_pdf_export=True,
        allow_csv_export=True,
        allow_sha256_certificate=True,
        allow_history=True,
        allow_custom_profiles=True,
        allow_projects=True,
        priority_processing=True
    )
}

def get_tier_features(tier_str: str) -> TierFeatures:
    try:
        tier = ProductTier(tier_str.upper())
        return TIER_DEFINITIONS[tier]
    except (ValueError, KeyError):
        return TIER_DEFINITIONS[ProductTier.FREE]
