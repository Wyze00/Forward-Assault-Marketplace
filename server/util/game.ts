export function getSkinCondition(condition: number) {
    if (condition <= 0.07) return { key: 'factory-new', name: 'Factory New' };
    if (condition <= 0.15) return { key: 'minimal-wear', name: 'Minimal Wear' };
    if (condition <= 0.38) return { key: 'field-tested', name: 'Field Tested' };
    if (condition <= 0.45) return { key: 'well-worn', name: 'Well Worn' };
    return { key: 'battle-scarred', name: 'Battle Scarred' };
};