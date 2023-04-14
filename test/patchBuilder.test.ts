import { describe, it, beforeEach } from 'https://deno.land/std@0.182.0/testing/bdd.ts';
import { expect } from 'https://deno.land/x/expect@v0.3.0/expect.ts';
import { PermissionCapability, XmlPatchInsert } from '../src/MarkLogicStructuredTypes.ts';

import PatchBuilder, { JsonPatchBuilder, XmlPatchBuilder } from '../src/PatchBuilder.ts';
import { MaybeArray } from '../src/UtilityTypes.ts';

describe('PatchBuilder', () => {
  it('cannot be directly instantiated', () => {
    // @ts-ignore: Intentional for unit tests
    expect(() => new PatchBuilder()).toThrow('Use PatchBuilder.for(<uri>) instead of directly instantiating a Patch Builder.');
  });

  it('throws an error if document URI does not end in ".xml" or ".json"', () => {
    expect(() => PatchBuilder.for('document.xslt')).toThrow('Unknown document format "xslt". Known formats: "xml", "json".');
  });

  it('json document uri returns a JSON patch builder', () => {
    expect(PatchBuilder.for('document.json')).toBeInstanceOf(JsonPatchBuilder);
  });

  describe('JSON Patch Builder', () => {
    function patch(patchElements: unknown[]) {
      return { patch: patchElements };
    }

    let pb: PatchBuilder;

    beforeEach(() => {
      pb = PatchBuilder.for('document.json');
    });

    describe('delete', () => {
      it('adds a deletion descriptor', () => {
        const deletion = { select: '/' };

        expect(pb.delete(deletion).build()).toEqual(patch([{ delete: deletion }]));
      });

      it('accepts multiple deletions in a single call', () => {
        const deletion = { select: '/' };
        const deletions = Array<typeof deletion>(5).fill(deletion);

        expect(pb.delete(...deletions).build()).toEqual(patch([...deletions.map(deletion => ({ delete: deletion }))]));
      });
    });

    describe('insert', () => {
      it('adds an insertion descriptor', () => {
        const insertion = { content: 'test', context: '/', position: 'before' } as XmlPatchInsert;

        expect(pb.insert(insertion).build()).toEqual(patch([{ insert: insertion }]));
      });

      it('adds a default position of "last-child" if none is provided', () => {
        const insertion = { content: 'test', context: '/' };

        expect(pb.insert(insertion).build()).toEqual(patch([{ insert: { position: 'last-child', ...insertion } }]));
      });

      it('accepts multiple insertions in a single call', () => {
        const insertion = { content: 'test', context: '/', position: 'last-child' } as XmlPatchInsert;
        const insertions = Array<typeof insertion>(5).fill(insertion);

        expect(pb.insert(...insertions).build()).toEqual(patch(insertions.map(insertion => ({ insert: insertion }))));
      });
    });

    describe('replace', () => {
      it('adds a replacement descriptor', () => {
        const replacement = { select: '/', content: 'test' };

        expect(pb.replace(replacement).build()).toEqual(patch([{ replace: replacement }]));
      });

      it('accepts multiple replacements in a single call', () => {
        const replacement = { select: '/', content: 'test' };
        const replacements = Array<typeof replacement>(5).fill(replacement);

        expect(pb.replace(...replacements).build()).toEqual(patch(replacements.map(replacement => ({ replace: replacement }))));
      });
    });

    describe('replaceInsert', () => {
      it('adds a replace-insert descriptor', () => {
        const replaceInsert = { select: '/', content: 'test', context: '/' };

        expect(pb.replaceInsert(replaceInsert).build()).toEqual(patch([{ 'replace-insert': replaceInsert }]));
      });

      it('accepts multiple replace-inserts in a single call', () => {
        const replaceInsert = { select: '/', content: 'test', context: '/' };
        const replaceInserts = Array<typeof replaceInsert>(5).fill(replaceInsert);

        expect(pb.replaceInsert(...replaceInserts).build()).toEqual(patch(replaceInserts.map(replaceInsert => ({ 'replace-insert': replaceInsert }))));
      });
    });

    describe('replaceLibrary', () => {
      it('adds a replace-library descriptor', () => {
        const replaceLibrary = { at: 'test' };

        expect(pb.replaceLibrary(replaceLibrary).build()).toEqual(patch([{ 'replace-library': replaceLibrary }]));
      });

      it('disallows calling more than once', () => expect(() => pb.replaceLibrary({ at: 'test' }).replaceLibrary({ ns: 'test' })).toThrow('replaceLibrary can only be used once per patch'));
    });
  });

  // NOTE: Cannot test XML Patch Builder in Deno as there is no native implementation of the required DOM APIs yet
  if (typeof XMLSerializer !== 'undefined') {
    it('xml document uri returns an XML patch builder', () => {
      expect(PatchBuilder.for('document.xml')).toBeInstanceOf(XmlPatchBuilder);
    });

    type ElementType = Record<string, Record<string, string>>;
    type BodyType = MaybeArray<ElementType>;

    describe('XML Patch Builder', () => {
      function patch(body: BodyType | string) {
        if (typeof body === 'string') {
          return body;
        }

        let result = '<rapi:patch xmlns:rapi="http://marklogic.com/rest-api">';

        for (const element of ([] as ElementType[]).concat(body)) {
          const entries = Object.entries(element);

          if (entries.length !== 1) {
            throw new Error('Expected single patch element in object, e.g.: insert, replace, delete, etc.');
          }

          const [[key, { content, ...attributes }]] = entries;
          const tagName = `rapi:${key}`;

          let t = Object.entries(attributes).reduce((acc, [name, value]) => `${acc} ${name}="${value}"`, `<${tagName}`);

          result += content
            ? t + `>${content}</${tagName}>`
            : t + '/>';
        }

        return result + '</rapi:patch>';
      }

      let pb: PatchBuilder;

      beforeEach(() => {
        pb = PatchBuilder.for('document.xml');
      });

      describe('delete', () => {
        it('adds a deletion descriptor', () => {
          const deletion = { select: '/' };

          expect(pb.delete(deletion).build()).toEqual(patch([{ delete: deletion }]));
        });

        it('accepts multiple deletions in a single call', () => {
          const deletion = { select: '/' };
          const deletions = Array<typeof deletion>(5).fill(deletion);

          expect(pb.delete(...deletions).build()).toEqual(patch([...deletions.map(deletion => ({ delete: deletion }))]));
        });
      });

      describe('insert', () => {
        it('adds an insertion descriptor', () => {
          const insertion = { content: 'test', context: '/', position: 'before' } as XmlPatchInsert;

          expect(pb.insert(insertion).build()).toEqual(patch([{ insert: insertion } as unknown as ElementType]));
        });

        it('adds a default position of "last-child" if none is provided', () => {
          const insertion = { content: 'test', context: '/' };

          expect(pb.insert(insertion).build()).toEqual(patch([{ insert: { position: 'last-child', ...insertion } }]));
        });

        it('accepts multiple insertions in a single call', () => {
          const insertion = { content: 'test', context: '/', position: 'last-child' } as XmlPatchInsert;
          const insertions = Array<typeof insertion>(5).fill(insertion);

          expect(pb.insert(...insertions).build()).toEqual(patch(insertions.map(insertion => ({ insert: insertion } as unknown as ElementType))));
        });
      });

      describe('replace', () => {
        it('adds a replacement descriptor', () => {
          const replacement = { select: '/', content: 'test' };

          expect(pb.replace(replacement).build()).toEqual(patch([{ replace: replacement }]));
        });

        it('accepts multiple replacements in a single call', () => {
          const replacement = { select: '/', content: 'test' };
          const replacements = Array<typeof replacement>(5).fill(replacement);

          expect(pb.replace(...replacements).build()).toEqual(patch(replacements.map(replacement => ({ replace: replacement }))));
        });
      });

      describe('replaceInsert', () => {
        it('adds a replace-insert descriptor', () => {
          const replaceInsert = { select: '/', content: 'test', context: '/' };

          expect(pb.replaceInsert(replaceInsert).build()).toEqual(patch([{ 'replace-insert': replaceInsert }]));
        });

        it('accepts multiple replace-inserts in a single call', () => {
          const replaceInsert = { select: '/', content: 'test', context: '/' };
          const replaceInserts = Array<typeof replaceInsert>(5).fill(replaceInsert);

          expect(pb.replaceInsert(...replaceInserts).build()).toEqual(patch(replaceInserts.map(replaceInsert => ({ 'replace-insert': replaceInsert }))));
        });
      });

      describe('replaceLibrary', () => {
        it('adds a replace-library descriptor', () => {
          const replaceLibrary = { at: 'test' };

          expect(pb.replaceLibrary(replaceLibrary).build()).toEqual(patch([{ 'replace-library': replaceLibrary }]));
        });

        it('disallows calling more than once', () => expect(() => pb.replaceLibrary({ at: 'test' }).replaceLibrary({ ns: 'test' })).toThrow('replaceLibrary can only be used once per patch'));
      });

      it('recursively converts JSON objects into XML elements correctly', () => {
        const json = {
          content: {
            subKey: {
              '@attributes': {
                boolean: true,
                string: 'Lorem ipsum dolor sit amet',
                number: 5.1,
              },
              text: 'Lorem ipsum dolor sit amet',
              number: 1.3e21,
              boolean: false,
              primitiveWithAttributes: {
                '@attributes': {
                  type: 'number',
                },
                '@text': 3,
              },
              array: [1, 2, 3],
            },
          },
          context: '/',
        };

        const expected = patch(`
          <rapi:patch xmlns:rapi="http://marklogic.com/rest-api">
            <rapi:insert position="last-child" context="/">
              <subKey boolean="${json.content.subKey['@attributes'].boolean}" string="${json.content.subKey['@attributes'].string}" number="${json.content.subKey['@attributes'].number}">
                <text>${json.content.subKey.text}</text>
                <number>${json.content.subKey.number}</number>
                <boolean>${json.content.subKey.boolean}</boolean>
                <primitiveWithAttributes type="${json.content.subKey.primitiveWithAttributes['@attributes'].type}">${json.content.subKey.primitiveWithAttributes['@text']}</primitiveWithAttributes>
                ${json.content.subKey.array.map(el => `<array>${el}</array>`).join('')}
              </subKey>
            </rapi:insert>
          </rapi:patch>
        `.replace(/\n\s*/g, ''));

        expect(pb.insert(json).build()).toEqual(expected);
      });

      it('recursively converts JSON arrays into XML elements correctly', () => {
        const content = {
          subKey: {
            '@attributes': {
              boolean: true,
              string: 'Lorem ipsum dolor sit amet',
              number: 5.1,
            },
            text: 'Lorem ipsum dolor sit amet',
            number: 1.3e21,
            boolean: false,
            primitiveWithAttributes: {
              '@attributes': {
                type: 'number',
              },
              '@text': 3,
            },
            array: [1, 2, 3],
          },
        };

        const json = {
          content: Array<typeof content>(2).fill(content),
          context: '/',
        };

        const expected = patch(`
          <rapi:patch xmlns:rapi="http://marklogic.com/rest-api">
            <rapi:insert position="last-child" context="/">
              ${json.content.map(element => `<subKey boolean="${element.subKey['@attributes'].boolean}" string="${element.subKey['@attributes'].string}" number="${element.subKey['@attributes'].number}">
                <text>${element.subKey.text}</text>
                <number>${element.subKey.number}</number>
                <boolean>${element.subKey.boolean}</boolean>
                <primitiveWithAttributes type="${element.subKey.primitiveWithAttributes['@attributes'].type}">${element.subKey.primitiveWithAttributes['@text']}</primitiveWithAttributes>
                ${element.subKey.array.map(el => `<array>${el}</array>`).join('')}
              </subKey>`).join('')}
            </rapi:insert>
          </rapi:patch>
        `.replace(/\n\s*/g, ''));

        expect(pb.insert(json).build()).toEqual(expected);
      });
    });
  }

  describe('shortcut methods', () => {
    let pb: PatchBuilder;
    let pb2: PatchBuilder;

    beforeEach(() => {
      pb = PatchBuilder.for('document.json');
      pb2 = PatchBuilder.for('document.json');
    });

    function expectEquality(b1: PatchBuilder, b2: PatchBuilder) {
      expect(b1.build()).toEqual(b2.build());
    }

    it('addCollections is analogous to insert with predefined context', () => {
      const collections = ['test', 'collection'];

      expectEquality(
        pb.addCollections(...collections),
        pb2.insert(...collections.map(collection => ({ context: '/array-node("collections")', content: collection }))),
      );
    });

    it('removeCollections is analogous to delete with predefined select', () => {
      const collections = ['test', 'collection'];

      expectEquality(
        pb.removeCollections(...collections),
        pb2.delete(...collections.map(collection => ({ select: `/collections[. eq "${collection}"]` }))),
      );
    });

    it('addPermission is analogous to insert with predetermined context', () => {
      const roleName = 'test';
      const capabilities = ['insert', 'update'] as PermissionCapability[];

      expectEquality(
        pb.addPermission(roleName, capabilities),
        pb2.insert({ context: '/array-node("permissions")', content: { 'role-name': roleName, capabilities: Array<string>().concat(capabilities) } }),
      );
    });

    it('replacePermission is analogous to replace with predetermined select', () => {
      const roleName = 'test';
      const capabilities = 'insert' as PermissionCapability;

      expectEquality(
        pb.replacePermission(roleName, capabilities),
        pb2.replace({ select: `/permissions[node("role-name") eq "${roleName}"]`, content: Array<string>().concat(capabilities) }),
      );
    });

    it('removePermission is analogous to delete with predetermined select', () => {
      const roleName = 'test';

      expectEquality(
        pb.removePermission(roleName),
        pb2.delete({ select: `/permissions[node("role-name") eq "${roleName}"]` }),
      );
    });

    it('addProperty is analogous to insert with predetermined context', () => {
      const name = 'test';
      const value = false;

      expectEquality(
        pb.addProperty(name, value),
        pb2.insert({ context: '/object-node("properties")', content: { [name]: value } }),
      );
    });

    it('replaceProperty is analogous to replace with predetermined select', () => {
      const name = 'test';
      const value = true;

      expectEquality(
        pb.replaceProperty(name, value),
        pb2.replace({ select: `/properties/node("${name}")`, content: value }),
      );
    });

    it('removeProperty is analogous to delete with predetermined select', () => {
      const name = 'test';

      expectEquality(
        pb.removeProperty(name),
        pb2.delete({ select: `/properties/node("${name}")` }),
      );
    });

    it('setQuality is analogous to replace with predetermined select', () => {
      expectEquality(
        pb.setQuality(4),
        pb2.replace({ select: '/quality', content: 4 }),
      );
    });

    it('addMetadataValue is analogous to insert with predetermined context', () => {
      const name = 'test';
      const value = 'false';

      expectEquality(
        pb.addMetadataValue(name, value),
        pb2.insert({ context: '/object-node("metadataValues")', content: { [name]: value } }),
      );
    });

    it('replaceMetadataValue is analogous to replace with predetermined select', () => {
      const name = 'test';
      const value = 'true';

      expectEquality(
        pb.replaceMetadataValue(name, value),
        pb2.replace({ select: `/metadataValues/node("${name}")`, content: value }),
      );
    });

    it('removeMetadataValue is analogous to delete with predetermined select', () => {
      const name = 'test';

      expectEquality(
        pb.removeMetadataValue(name),
        pb2.delete({ select: `/metadataValues/node("${name}")` }),
      );
    });

    it('add is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.add('/', 5),
        pb2.replace({ select: '/', apply: 'ml.add', content: [{ $value: 5 }] }),
      );
    });

    it('subtract is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.subtract('/', 5),
        pb2.replace({ select: '/', apply: 'ml.subtract', content: [{ $value: 5 }] }),
      );
    });

    it('multiply is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.multiply('/', 5),
        pb2.replace({ select: '/', apply: 'ml.multiply', content: [{ $value: 5 }] }),
      );
    });

    it('divide is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.divide('/', 5),
        pb2.replace({ select: '/', apply: 'ml.divide', content: [{ $value: 5 }] }),
      );
    });

    it('prepend is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.prepend('/', 'test'),
        pb2.replace({ select: '/', apply: 'ml.concat-before', content: [{ $value: 'test' }] }),
      );
    });

    it('append is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.append('/', 'test'),
        pb2.replace({ select: '/', apply: 'ml.concat-after', content: [{ $value: 'test' }] }),
      );
    });

    it('concat is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.concat('/', 'test1', 'test2'),
        pb2.replace({ select: '/', apply: 'ml.concat-between', content: [{ $value: 'test1' }, { $value: 'test2' }] }),
      );
    });

    it('substringAfter is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.substringAfter('/', 5),
        pb2.replace({ select: '/', apply: 'ml.substring-after', content: [{ $value: 5 }] }),
      );
    });

    it('substringBefore is analogous to replace with predetermined context, apply, and args', () => {
      expectEquality(
        pb.substringBefore('/', 5),
        pb2.replace({ select: '/', apply: 'ml.substring-before', content: [{ $value: 5 }] }),
      );
    });

    it('replaceRegex is analogous to replace with predetermined context, apply, and args', () => {
      const regex = '^t(e|oa)st$';
      const replace = 'bread';
      const flags = 'i';

      expectEquality(
        pb.replaceRegex('/', regex, replace),
        pb2.replace({ select: '/', apply: 'ml.replace-regex', content: [{ $value: regex }, { $value: replace }] }),
      );
      expectEquality(
        pb.replaceRegex('/', regex, replace, flags),
        pb2.replace({ select: '/', apply: 'ml.replace-regex', content: [{ $value: regex }, { $value: replace }, { $value: flags }] }),
      );
    });
  });
});

