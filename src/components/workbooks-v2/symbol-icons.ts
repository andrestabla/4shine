import type { LucideIcon } from 'lucide-react'
import {
    Compass,
    Mountain,
    Waves,
    Sprout,
    Flame,
    Building2,
    Map,
    Anchor,
    Rocket,
    Target,
    Gem,
    Lightbulb,
    Zap,
    Route,
    TreePine,
    Sparkles,
    Network,
    Orbit,
} from 'lucide-react'

export interface SymbolIcon {
    /** Identificador estable que se guarda como `icon:<name>` en el valor del campo. */
    name: string
    /** Etiqueta visible en el selector. */
    label: string
    Icon: LucideIcon
}

/**
 * Repositorio de íconos modernos para el "código simbólico" del WB9 (sección 7.4).
 * Compartido entre el editor (preview/grid) y el generador de PDF (rasterizado).
 */
export const SYMBOL_ICONS: SymbolIcon[] = [
    { name: 'compass', label: 'Brújula', Icon: Compass },
    { name: 'mountain', label: 'Montaña', Icon: Mountain },
    { name: 'waves', label: 'Río / olas', Icon: Waves },
    { name: 'sprout', label: 'Semilla', Icon: Sprout },
    { name: 'tree', label: 'Raíz / árbol', Icon: TreePine },
    { name: 'flame', label: 'Fuego', Icon: Flame },
    { name: 'building', label: 'Arquitectura', Icon: Building2 },
    { name: 'map', label: 'Mapa', Icon: Map },
    { name: 'route', label: 'Ruta', Icon: Route },
    { name: 'anchor', label: 'Ancla', Icon: Anchor },
    { name: 'rocket', label: 'Impulso', Icon: Rocket },
    { name: 'target', label: 'Foco', Icon: Target },
    { name: 'gem', label: 'Valor', Icon: Gem },
    { name: 'lightbulb', label: 'Idea', Icon: Lightbulb },
    { name: 'zap', label: 'Energía', Icon: Zap },
    { name: 'network', label: 'Conexión', Icon: Network },
    { name: 'orbit', label: 'Visión', Icon: Orbit },
    { name: 'sparkles', label: 'Constelación', Icon: Sparkles },
]

export const SYMBOL_ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
    SYMBOL_ICONS.map((item) => [item.name, item.Icon]),
)

/** Devuelve el nombre del ícono si el valor es del tipo `icon:<name>`, o null. */
export function parseIconValue(value: string | undefined | null): string | null {
    if (typeof value === 'string' && value.startsWith('icon:')) {
        const name = value.slice(5).trim()
        return SYMBOL_ICON_MAP[name] ? name : null
    }
    return null
}
