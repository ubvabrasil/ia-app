"use client";

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';

export interface UrlDisplayParams {
  showHeader: boolean;
  showFooter: boolean;
  showWebglassButton: boolean;
}

/**
 * Hook para ler parâmetros de URL que controlam a exibição de elementos da UI
 * 
 * Parâmetros suportados:
 * - header=false -> esconde o header
 * - footer=false -> esconde o footer
 * - webglassbutton=false -> esconde o botão do WebGlass
 * 
 * Por padrão, todos os elementos são visíveis (true)
 */
export function useUrlParams(): UrlDisplayParams {
  const searchParams = useSearchParams();

  const params = useMemo(() => {
    const headerParam = searchParams.get('header');
    const footerParam = searchParams.get('footer');
    const webglassButtonParam = searchParams.get('webglassbutton');

    return {
      showHeader: headerParam !== 'false',
      showFooter: footerParam !== 'false',
      showWebglassButton: webglassButtonParam !== 'false',
    };
  }, [searchParams]);

  return params;
}
