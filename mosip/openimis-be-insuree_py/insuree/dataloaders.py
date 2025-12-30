from promise.dataloader import DataLoader
from promise import Promise

from .models import Insuree, Family


class InsureeLoader(DataLoader):
    def batch_load_fn(self, keys):
        insurees = {
            insuree.id: insuree for insuree in Insuree.objects.filter(id__in=keys)
        }
        return Promise.resolve([insurees.get(insuree_id) for insuree_id in keys])


class FamilyLoader(DataLoader):
    def batch_load_fn(self, keys):
        families = {family.id: family for family in Family.objects.filter(id__in=keys)}
        return Promise.resolve([families.get(family_id) for family_id in keys])
