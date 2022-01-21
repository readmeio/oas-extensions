import * as extensions from '../src';
import Oas from 'oas';
import petstore from '@readme/oas-examples/3.0/json/petstore.json';

test.each([
  ['CODE_SAMPLES'],
  ['EXPLORER_ENABLED'],
  ['HEADERS'],
  ['PROXY_ENABLED'],
  ['SAMPLES_ENABLED'],
  ['SAMPLES_LANGUAGES'],
  ['SEND_DEFAULTS'],
  ['SIMPLE_MODE'],
])('`%s` extension should have a default value', extension => {
  expect(extensions[extension] in extensions.defaults).toBe(true);
});

describe('#getExtension', () => {
  it("should not throw an exception if `Oas` doesn't have an API definition", () => {
    const oas = Oas.init(undefined);
    expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas)).toHaveLength(5);
  });

  it("should not throw an exception if `Operation` doesn't have an API definition", () => {
    const oas = Oas.init(undefined);
    const operation = oas.operation('/pet', 'post');
    expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas, operation)).toHaveLength(5);
  });

  describe('oas-level extensions', () => {
    it('should use the default extension value if the extension is not present', () => {
      const oas = Oas.init(petstore);
      expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas)).toStrictEqual([
        'curl',
        'node',
        'ruby',
        'php',
        'python',
      ]);
    });

    it('should locate an extensions under `x-readme`', () => {
      const oas = Oas.init({
        ...petstore,
        'x-readme': {
          [extensions.SAMPLES_LANGUAGES]: ['swift'],
        },
      });

      expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas)).toStrictEqual(['swift']);
    });

    it('should locate an extensions listed at the root', () => {
      const oas = Oas.init({ ...petstore, [`x-${extensions.EXPLORER_ENABLED}`]: false });
      expect(extensions.getExtension(extensions.EXPLORER_ENABLED, oas)).toBe(false);
    });

    it('should not throw if `x-readme` is not an object', () => {
      const oas = Oas.init({
        ...petstore,
        'x-readme': true,
      });

      expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas)).toHaveLength(5);
    });

    it('should not pick up the `code-samples` extension', () => {
      const oas = Oas.init({
        ...petstore,
        'x-readme': {
          [extensions.CODE_SAMPLES]: [
            {
              name: 'Custom cURL snippet',
              language: 'curl',
              code: 'curl -X POST https://api.example.com/v2/alert',
            },
          ],
        },
      });

      expect(extensions.getExtension(extensions.CODE_SAMPLES, oas)).toBeUndefined();
    });
  });

  describe('operation-level', () => {
    const oas = Oas.init(petstore);

    it('should use the default extension value if the extension is not present', () => {
      const operation = oas.operation('/pet', 'post');

      expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas, operation)).toStrictEqual([
        'curl',
        'node',
        'ruby',
        'php',
        'python',
      ]);
    });

    it('should locate an extensions under `x-readme`', () => {
      const operation = oas.operation('/pet', 'post');
      operation.schema['x-readme'] = {
        [extensions.SAMPLES_LANGUAGES]: ['swift'],
      };

      expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas, operation)).toStrictEqual(['swift']);
    });

    it('should locate an extensions listed at the root', () => {
      const operation = oas.operation('/pet', 'post');
      operation.schema[`x-${extensions.EXPLORER_ENABLED}`] = false;

      expect(extensions.getExtension(extensions.EXPLORER_ENABLED, oas, operation)).toBe(false);
    });

    it('should not throw if `x-readme` is not an object', () => {
      const operation = oas.operation('/pet', 'post');
      operation.schema['x-readme'] = true;

      expect(extensions.getExtension(extensions.SAMPLES_LANGUAGES, oas)).toHaveLength(5);
    });
  });
});

describe('#isExtensionValid()', () => {
  it('should validate that `x-readme` is an object', () => {
    expect(() => {
      extensions.validateExtension(extensions.EXPLORER_ENABLED, Oas.init({ 'x-readme': [] }));
    }).toThrow(/must be of type "Object"/);

    expect(() => {
      extensions.validateExtension(extensions.EXPLORER_ENABLED, Oas.init({ 'x-readme': false }));
    }).toThrow(/must be of type "Object"/);

    expect(() => {
      extensions.validateExtension(extensions.EXPLORER_ENABLED, Oas.init({ 'x-readme': null }));
    }).toThrow(/must be of type "Object"/);
  });

  describe.each([
    ['CODE_SAMPLES', [], false, 'Array'],
    ['EXPLORER_ENABLED', true, 'false', 'Boolean'],
    ['HEADERS', [{ key: 'X-API-Key', value: 'abc123' }], false, 'Array'],
    ['PROXY_ENABLED', true, 'yes', 'Boolean'],
    ['SAMPLES_ENABLED', true, 'no', 'Boolean'],
    ['SAMPLES_LANGUAGES', ['swift'], {}, 'Array'],
    ['SEND_DEFAULTS', true, 'absolutely not', 'Boolean'],
    ['SIMPLE_MODE', true, 'absolutely not', 'Boolean'],
  ])('%s', (extension, validValue, invalidValue, expectedType) => {
    describe('should allow valid extensions', () => {
      it('should allow at the root level', () => {
        expect(() => {
          extensions.validateExtension(extensions[extension], Oas.init({ [`x-${extensions[extension]}`]: validValue }));
        }).not.toThrow();
      });

      it('should allow if nested in `x-readme`', () => {
        expect(() => {
          extensions.validateExtension(
            extensions[extension],
            Oas.init({
              'x-readme': {
                [extensions[extension]]: validValue,
              },
            })
          );
        }).not.toThrow();
      });
    });

    describe('should fail on invalid extension values', () => {
      it('should error if at the root level', () => {
        expect(() => {
          extensions.validateExtension(
            extensions[extension],
            Oas.init({ [`x-${extensions[extension]}`]: invalidValue })
          );
        }).toThrow(new RegExp(`"x-${extensions[extension]}" must be of type "${expectedType}"`));
      });

      it('should error if nested in `x-readme`', () => {
        expect(() => {
          extensions.validateExtension(
            extensions[extension],
            Oas.init({
              'x-readme': {
                [extensions[extension]]: invalidValue,
              },
            })
          );
        }).toThrow(new RegExp(`"x-readme.${extensions[extension]}" must be of type "${expectedType}"`));
      });
    });
  });
});
