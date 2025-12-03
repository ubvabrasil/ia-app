# Sistema de Design UBVA

## 🎨 Paleta de Cores

### Cores Principais
- **Azul Principal**: `#0A6A9E` - Cor primária da marca
- **Azul Claro**: `#50E8F2` - Cor secundária, acentos
- **Cinza Escuro**: `#474747` - Texto e elementos escuros
- **Cinza Claro**: `#DBDBDB` - Bordas e fundos suaves

### Mapeamento de Cores no Sistema

#### Tema Light
```css
--primary: #0A6A9E          /* Azul principal */
--secondary: #50E8F2         /* Azul claro */
--foreground: #474747        /* Cinza escuro - texto */
--muted: #DBDBDB            /* Cinza claro - bordas */
--background: #FFFFFF        /* Branco */
```

#### Tema Dark
```css
--primary: #0A6A9E          /* Azul principal */
--secondary: #50E8F2         /* Azul claro */
--foreground: #DBDBDB        /* Cinza claro - texto */
--muted: #474747            /* Cinza escuro - bordas */
--background: #1a1a1a       /* Preto suave */
```

## 🔤 Tipografia

### Fontes

1. **Principal (Headings)**: Cal Sans
   - Uso: Títulos, headings (h1-h6)
   - Peso: 600 (Semi-bold)
   - Substituto para: LT Aspirer Neue

2. **Secundária (UI Elements)**: Cal Sans
   - Uso: Botões, navegação, elementos de interface
   - Peso: 400-600

3. **Corpo (Body Text)**: Inter
   - Uso: Texto corrido, parágrafos, conteúdo
   - Pesos: 300, 400, 500, 600, 700
   - Fallback: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif

### Hierarquia Tipográfica

```css
/* Headings */
h1, h2, h3, h4, h5, h6 {
  font-family: 'Cal Sans', sans-serif;
  font-weight: 600;
}

/* Body */
body, p, span {
  font-family: 'Inter', sans-serif;
}

/* Buttons */
button {
  font-family: 'Cal Sans', sans-serif;
}
```

## 📐 Espaçamento e Layout

### Border Radius
- Padrão: `0.625rem` (10px)
- Pequeno: `calc(var(--radius) - 4px)` (6px)
- Médio: `calc(var(--radius) - 2px)` (8px)
- Grande: `var(--radius)` (10px)
- Extra Grande: `calc(var(--radius) + 4px)` (14px)

## 🎯 Uso das Cores

### Botões
- **Primário**: Fundo `#0A6A9E`, texto branco
- **Secundário**: Fundo `#50E8F2`, texto `#474747`
- **Outline**: Borda `#0A6A9E`, sem fundo

### Links
- Cor: `#0A6A9E`
- Hover: `#50E8F2`

### Estados
- **Hover**: Aumentar opacidade ou usar `#50E8F2`
- **Active**: Escurecer `#0A6A9E` em 10%
- **Disabled**: `#DBDBDB` com opacidade 50%

### Bordas e Divisores
- Light: `#DBDBDB`
- Dark: `#474747`

## 💡 Diretrizes de Uso

1. Use `#0A6A9E` para ações primárias e elementos de destaque
2. Use `#50E8F2` para acentos e feedback positivo
3. Use `#474747` para texto principal no tema light
4. Use `#DBDBDB` para texto secundário e bordas no tema light
5. Mantenha contraste adequado (WCAG AA minimum)

## 🔄 Tokens CSS

```css
/* Acessar cores via CSS variables */
var(--primary)      /* #0A6A9E */
var(--secondary)    /* #50E8F2 */
var(--foreground)   /* #474747 ou #DBDBDB */
var(--muted)        /* #DBDBDB ou #474747 */

/* Acessar fontes */
var(--font-heading)   /* Cal Sans */
var(--font-secondary) /* Cal Sans */
var(--font-body)      /* Inter */
```
