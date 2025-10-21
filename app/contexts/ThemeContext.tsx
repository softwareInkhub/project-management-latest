'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setThemeState(savedTheme);
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setThemeState(prefersDark ? 'dark' : 'light');
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      
      // Force dark mode styles on all elements
      setTimeout(() => {
        const whiteElements = document.querySelectorAll('.bg-white');
        whiteElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '#1f2937';
        });
        
        const grayElements = document.querySelectorAll('.bg-gray-50');
        grayElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '#111827';
        });
        
        const textElements = document.querySelectorAll('.text-gray-900');
        textElements.forEach(el => {
          (el as HTMLElement).style.color = '#f9fafb';
        });
        
        const borderElements = document.querySelectorAll('.border-gray-200');
        borderElements.forEach(el => {
          (el as HTMLElement).style.borderColor = '#374151';
        });
        
        // Force gradient backgrounds to solid dark colors
        const gradientElements = document.querySelectorAll('[class*="bg-gradient-to-r"]');
        gradientElements.forEach(el => {
          (el as HTMLElement).style.background = '#374151';
        });
        
        // Force task item backgrounds
        const groupElements = document.querySelectorAll('.group');
        groupElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '#374151';
        });
        
        // Force text elements to be more visible
        const textElements600 = document.querySelectorAll('.text-gray-600');
        textElements600.forEach(el => {
          (el as HTMLElement).style.color = '#e5e7eb';
        });
        
        const textElements500 = document.querySelectorAll('.text-gray-500');
        textElements500.forEach(el => {
          (el as HTMLElement).style.color = '#d1d5db';
        });
        
        const textElements400 = document.querySelectorAll('.text-gray-400');
        textElements400.forEach(el => {
          (el as HTMLElement).style.color = '#e5e7eb';
        });
        
          // Force input field text visibility
          const inputElements = document.querySelectorAll('input');
          inputElements.forEach(el => {
            (el as HTMLElement).style.color = '#f9fafb';
          });
          
          const textareaElements = document.querySelectorAll('textarea');
          textareaElements.forEach(el => {
            (el as HTMLElement).style.color = '#f9fafb';
          });
          
          // Force label text visibility
          const labelElements = document.querySelectorAll('label');
          labelElements.forEach(el => {
            (el as HTMLElement).style.color = '#f3f4f6';
          });
          
          // Force all text elements to be visible
          const textElements700 = document.querySelectorAll('.text-gray-700');
          textElements700.forEach(el => {
            (el as HTMLElement).style.color = '#f3f4f6';
          });
          
          const textElements800 = document.querySelectorAll('.text-gray-800');
          textElements800.forEach(el => {
            (el as HTMLElement).style.color = '#f9fafb';
          });
          
          // Force heading elements
          const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headingElements.forEach(el => {
            (el as HTMLElement).style.color = '#f9fafb';
          });
          
          // Force font weight elements
          const fontElements = document.querySelectorAll('.font-semibold, .font-medium');
          fontElements.forEach(el => {
            (el as HTMLElement).style.color = '#f3f4f6';
          });
          
          // Force dashboard card text to stay white in dark mode
          const dashboardCards = document.querySelectorAll('[class*="bg-gradient-to-r"][class*="from-blue"] [class*="text-white"], [class*="bg-gradient-to-r"][class*="from-green"] [class*="text-white"], [class*="bg-gradient-to-r"][class*="from-purple"] [class*="text-white"], [class*="bg-gradient-to-r"][class*="from-orange"] [class*="text-white"]');
          dashboardCards.forEach(el => {
            (el as HTMLElement).style.color = '#ffffff';
          });
          
          // Force any text inside colored gradient cards to stay white
          const coloredCards = document.querySelectorAll('.bg-gradient-to-r');
          coloredCards.forEach(card => {
            const cardElement = card as HTMLElement;
            const hasColor = cardElement.className.includes('from-blue') || 
                            cardElement.className.includes('from-green') || 
                            cardElement.className.includes('from-purple') || 
                            cardElement.className.includes('from-orange') ||
                            cardElement.className.includes('from-red');
            
            if (hasColor) {
              const textElements = cardElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
              textElements.forEach(textEl => {
                const textElement = textEl as HTMLElement;
                if (textElement.className.includes('text-white') || 
                    textElement.className.includes('text-gray-100') ||
                    textElement.className.includes('text-gray-50')) {
                  textElement.style.color = '#ffffff';
                }
              });
            }
          });

          // Force SVG icons (but preserve logo styling)
          const svgElements = document.querySelectorAll('svg');
          svgElements.forEach(el => {
            // Check if this is a logo or avatar icon that should remain white
            const parentElement = el.parentElement;
            if (parentElement && (
              parentElement.classList.contains('bg-blue-500') || 
              parentElement.classList.contains('bg-gradient-to-br') ||
              parentElement.classList.contains('avatar') ||
              parentElement.querySelector('.bg-blue-500') ||
              parentElement.querySelector('.bg-gradient-to-br')
            )) {
              // Keep logo/avatar icons white in dark mode too
              (el as any).style.color = '#ffffff';
            } else {
              // Regular icons get light gray color
              (el as any).style.color = '#e5e7eb';
            }
          });
          
          // Force colored icons
          const blueIcons = document.querySelectorAll('.text-blue-600');
          blueIcons.forEach(el => {
            (el as HTMLElement).style.color = '#60a5fa';
          });
          
          const redIcons = document.querySelectorAll('.text-red-600');
          redIcons.forEach(el => {
            (el as HTMLElement).style.color = '#f87171';
          });
          
          const orangeIcons = document.querySelectorAll('.text-orange-600');
          orangeIcons.forEach(el => {
            (el as HTMLElement).style.color = '#fb923c';
          });
          
          const greenIcons = document.querySelectorAll('.text-green-600');
          greenIcons.forEach(el => {
            (el as HTMLElement).style.color = '#4ade80';
          });
          
          const purpleIcons = document.querySelectorAll('.text-purple-600');
          purpleIcons.forEach(el => {
            (el as HTMLElement).style.color = '#a78bfa';
          });
          
          const indigoIcons = document.querySelectorAll('.text-indigo-600');
          indigoIcons.forEach(el => {
            (el as HTMLElement).style.color = '#818cf8';
          });
      }, 100);
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
      
      // Reset styles for light mode
      setTimeout(() => {
        // Reset all forced dark mode styles
        const allElements = document.querySelectorAll('*');
        allElements.forEach(el => {
          const element = el as HTMLElement;
          element.style.backgroundColor = '';
          element.style.color = '';
          element.style.borderColor = '';
          element.style.background = '';
        });
        
        // Force light mode styles
        const whiteElements = document.querySelectorAll('.bg-white');
        whiteElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '#ffffff';
        });
        
        const grayElements = document.querySelectorAll('.bg-gray-50');
        grayElements.forEach(el => {
          (el as HTMLElement).style.backgroundColor = '#f9fafb';
        });
        
        const textElements = document.querySelectorAll('.text-gray-900');
        textElements.forEach(el => {
          (el as HTMLElement).style.color = '#111827';
        });
        
        const textElements600 = document.querySelectorAll('.text-gray-600');
        textElements600.forEach(el => {
          (el as HTMLElement).style.color = '#4b5563';
        });
        
        const textElements500 = document.querySelectorAll('.text-gray-500');
        textElements500.forEach(el => {
          (el as HTMLElement).style.color = '#6b7280';
        });
        
        const textElements400 = document.querySelectorAll('.text-gray-400');
        textElements400.forEach(el => {
          (el as HTMLElement).style.color = '#9ca3af';
        });
        
        const textElements700 = document.querySelectorAll('.text-gray-700');
        textElements700.forEach(el => {
          (el as HTMLElement).style.color = '#374151';
        });
        
        const textElements800 = document.querySelectorAll('.text-gray-800');
        textElements800.forEach(el => {
          (el as HTMLElement).style.color = '#1f2937';
        });
        
        // Force input field text visibility for light mode
        const inputElements = document.querySelectorAll('input');
        inputElements.forEach(el => {
          (el as HTMLElement).style.color = '#111827';
          (el as HTMLElement).style.backgroundColor = '#ffffff';
        });
        
        const textareaElements = document.querySelectorAll('textarea');
        textareaElements.forEach(el => {
          (el as HTMLElement).style.color = '#111827';
          (el as HTMLElement).style.backgroundColor = '#ffffff';
        });
        
        // Force label text visibility for light mode
        const labelElements = document.querySelectorAll('label');
        labelElements.forEach(el => {
          (el as HTMLElement).style.color = '#374151';
        });
        
        // Force heading elements for light mode
        const headingElements = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        headingElements.forEach(el => {
          (el as HTMLElement).style.color = '#111827';
        });
        
        // Force font weight elements for light mode
        const fontElements = document.querySelectorAll('.font-semibold, .font-medium');
        fontElements.forEach(el => {
          (el as HTMLElement).style.color = '#374151';
        });
        
        // Force dashboard card text to stay white in light mode
        const dashboardCards = document.querySelectorAll('[class*="bg-gradient-to-r"][class*="from-blue"] [class*="text-white"], [class*="bg-gradient-to-r"][class*="from-green"] [class*="text-white"], [class*="bg-gradient-to-r"][class*="from-purple"] [class*="text-white"], [class*="bg-gradient-to-r"][class*="from-orange"] [class*="text-white"]');
        dashboardCards.forEach(el => {
          (el as HTMLElement).style.color = '#ffffff';
        });
        
        // Force any text inside colored gradient cards to stay white
        const coloredCards = document.querySelectorAll('.bg-gradient-to-r');
        coloredCards.forEach(card => {
          const cardElement = card as HTMLElement;
          const hasColor = cardElement.className.includes('from-blue') || 
                          cardElement.className.includes('from-green') || 
                          cardElement.className.includes('from-purple') || 
                          cardElement.className.includes('from-orange') ||
                          cardElement.className.includes('from-red');
          
          if (hasColor) {
            const textElements = cardElement.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div');
            textElements.forEach(textEl => {
              const textElement = textEl as HTMLElement;
              if (textElement.className.includes('text-white') || 
                  textElement.className.includes('text-gray-100') ||
                  textElement.className.includes('text-gray-50')) {
                textElement.style.color = '#ffffff';
              }
            });
          }
        });

        // Force SVG icons for light mode (but preserve logo styling)
        const svgElements = document.querySelectorAll('svg');
        svgElements.forEach(el => {
          // Check if this is a logo or avatar icon that should remain white
          const parentElement = el.parentElement;
          if (parentElement && (
            parentElement.classList.contains('bg-blue-500') || 
            parentElement.classList.contains('bg-gradient-to-br') ||
            parentElement.classList.contains('avatar') ||
            parentElement.querySelector('.bg-blue-500') ||
            parentElement.querySelector('.bg-gradient-to-br')
          )) {
            // Keep logo/avatar icons white
            (el as any).style.color = '#ffffff';
          } else {
            // Regular icons get gray color
            (el as any).style.color = '#4b5563';
          }
        });
        
        // Force colored icons for light mode
        const blueIcons = document.querySelectorAll('.text-blue-600');
        blueIcons.forEach(el => {
          (el as HTMLElement).style.color = '#2563eb';
        });
        
        const redIcons = document.querySelectorAll('.text-red-600');
        redIcons.forEach(el => {
          (el as HTMLElement).style.color = '#dc2626';
        });
        
        const orangeIcons = document.querySelectorAll('.text-orange-600');
        orangeIcons.forEach(el => {
          (el as HTMLElement).style.color = '#ea580c';
        });
        
        const greenIcons = document.querySelectorAll('.text-green-600');
        greenIcons.forEach(el => {
          (el as HTMLElement).style.color = '#16a34a';
        });
        
        const purpleIcons = document.querySelectorAll('.text-purple-600');
        purpleIcons.forEach(el => {
          (el as HTMLElement).style.color = '#9333ea';
        });
        
        const indigoIcons = document.querySelectorAll('.text-indigo-600');
        indigoIcons.forEach(el => {
          (el as HTMLElement).style.color = '#4f46e5';
        });
      }, 100);
    }
    
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setTheme = (newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
