/* eslint-disable react/no-danger */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import { GetStaticPaths, GetStaticProps } from 'next';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getPrismicClient } from '../../services/prismic';
import Header from '../../components/Header';
import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const router = useRouter();

  const readTime = useMemo(() => {
    if (router.isFallback) {
      return 0;
    }

    let fullText = '';
    const readWordsPerMinute = 200;

    post.data.content.forEach(postContent => {
      fullText += postContent.heading;
      fullText += RichText.asText(postContent.body);
    });

    const time = Math.ceil(fullText.split(/\s/g).length / readWordsPerMinute);

    return time;
  }, [post, router.isFallback]);

  if (router.isFallback) {
    return <p>Carregando...</p>;
  }
  return (
    <>
      <Header />
      <main>
        <img
          className={styles.postImage}
          src={post?.data?.banner.url}
          alt={post?.data?.title}
        />
        <article
          className={`${commonStyles.contentContainer} ${styles.postContent}`}
        >
          <header className={styles.postHeader}>
            <h1>{post?.data?.title}</h1>
          </header>
          <footer className={commonStyles.dateAuthorReading}>
            <span>
              <FiCalendar />
              {format(new Date(post.first_publication_date), 'dd MMM yyyy', {
                locale: ptBR,
              })}
            </span>
            <span>
              <FiUser />
              {post?.data?.author}
            </span>
            <span>
              <FiClock />
              {readTime} min
            </span>
          </footer>
          <div className={styles.postBody}>
            {post.data.content.map(postContent => {
              return (
                <div key={postContent.heading}>
                  <h2>{postContent.heading}</h2>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: RichText.asHtml(postContent.body),
                    }}
                  />
                </div>
              );
            })}
          </div>
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 10,
    }
  );

  const paths = posts.results.map(post => ({
    params: { slug: post.uid },
  }));

  return {
    paths,
    fallback: true,
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const { slug } = context.params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('posts', String(slug), {});

  const post = {
    uid: response.uid,
    data: {
      title: response.data.title,
      subtitle: response.data.subtitle,
      banner: response.data.banner,
      author: response.data.author,
      content: response.data.content,
    },
    first_publication_date: response.first_publication_date,
  };

  return {
    props: {
      post,
    },
  };
};
